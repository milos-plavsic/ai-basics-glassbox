export type Chunk = {
  id: string;
  index: number;
  sourceLabel: string;
  text: string;
  tokenEstimate: number;
  topTerms: string[];
};

export type RetrievalResult = {
  chunk: Chunk;
  score: number;
  selected: boolean;
  point: {
    x: number;
    y: number;
  };
};

export type PromptParts = {
  system: string;
  context: string;
  question: string;
};

export type Answer = {
  title: string;
  body: string;
  citations: string[];
};

export type QualityCheck = {
  label: string;
  value: string;
  tone: 'good' | 'warn' | 'bad';
  detail: string;
};

export type PipelineRun = {
  chunks: Chunk[];
  retrieval: RetrievalResult[];
  selected: RetrievalResult[];
  prompt: PromptParts;
  groundedAnswer: Answer;
  ungroundedAnswer: Answer;
  checks: QualityCheck[];
  nextStep: string;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'can',
  'for',
  'from',
  'has',
  'have',
  'how',
  'if',
  'in',
  'is',
  'it',
  'of',
  'on',
  'or',
  'should',
  'the',
  'their',
  'then',
  'to',
  'when',
  'where',
  'with',
  'within',
  'why',
  'will'
]);

const SYSTEM_INSTRUCTION =
  'Answer using only the retrieved context. Cite chunk ids for every factual claim. If the context is weak, say what evidence is missing.';

export const tokenize = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .match(/[a-z0-9]+/g)
    ?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];
};

export const splitIntoChunks = (source: string): Chunk[] => {
  const blocks = source
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const title = blocks[0] && blocks[0].length < 80 ? blocks[0] : 'Source';
  const contentBlocks = blocks[0] === title ? blocks.slice(1) : blocks;

  return contentBlocks.map((block, index) => {
    const tokens = tokenize(block);
    return {
      id: `C${index + 1}`,
      index,
      sourceLabel: title,
      text: block,
      tokenEstimate: Math.max(1, Math.round(block.split(/\s+/).filter(Boolean).length * 1.33)),
      topTerms: topTerms(tokens, 4)
    };
  });
};

export const buildVocabulary = (texts: string[]): string[] => {
  const vocabulary = new Set<string>();
  texts.forEach((text) => tokenize(text).forEach((token) => vocabulary.add(token)));
  return [...vocabulary].sort();
};

export const vectorize = (text: string, vocabulary: string[]): number[] => {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return vocabulary.map((term) => {
    const raw = counts.get(term) ?? 0;
    return raw === 0 ? 0 : 1 + Math.log(raw);
  });
};

export const cosineSimilarity = (left: number[], right: number[]): number => {
  const dot = left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
  const leftNorm = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
  const rightNorm = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (leftNorm * rightNorm);
};

export const runPipeline = (source: string, question: string, topK = 3): PipelineRun => {
  const chunks = splitIntoChunks(source);
  const vocabulary = buildVocabulary([question, ...chunks.map((chunk) => chunk.text)]);
  const queryVector = vectorize(question, vocabulary);
  const queryTokens = new Set(tokenize(question));

  const ranked = chunks
    .map((chunk) => {
      const chunkVector = vectorize(chunk.text, vocabulary);
      const score = cosineSimilarity(queryVector, chunkVector);
      const overlap = chunk.topTerms.filter((term) => queryTokens.has(term)).length;
      return {
        chunk,
        score,
        selected: false,
        point: projectPoint(chunkVector, score, overlap, chunk.index)
      };
    })
    .sort((a, b) => b.score - a.score)
    .map((result, index) => ({ ...result, selected: index < topK && result.score > 0 }));

  const selected = ranked.filter((result) => result.selected);
  const prompt = assemblePrompt(selected, question);
  const groundedAnswer = synthesizeGroundedAnswer(selected, question);
  const ungroundedAnswer = synthesizeUngroundedAnswer(question);
  const checks = buildQualityChecks(selected, question, groundedAnswer);

  return {
    chunks,
    retrieval: ranked,
    selected,
    prompt,
    groundedAnswer,
    ungroundedAnswer,
    checks,
    nextStep: suggestNextStep(checks)
  };
};

export const assemblePrompt = (selected: RetrievalResult[], question: string): PromptParts => {
  const context =
    selected.length === 0
      ? 'No relevant context retrieved.'
      : selected.map((result) => `[${result.chunk.id}] ${result.chunk.text}`).join('\n\n');

  return {
    system: SYSTEM_INSTRUCTION,
    context,
    question: question.trim() || 'No question provided.'
  };
};

const synthesizeGroundedAnswer = (selected: RetrievalResult[], question: string): Answer => {
  if (question.trim().length === 0) {
    return {
      title: 'Grounded answer',
      body: 'Enter a question to generate a grounded answer.',
      citations: []
    };
  }

  if (selected.length === 0) {
    return {
      title: 'Grounded answer',
      body: 'I do not have enough retrieved evidence to answer this from the source.',
      citations: []
    };
  }

  const bestSentences = selected
    .flatMap((result) => pickSentences(result.chunk.text, question).map((sentence) => ({ sentence, id: result.chunk.id })))
    .slice(0, 4);

  const body =
    bestSentences.length === 0
      ? `The strongest retrieved evidence is in ${selected.map((result) => result.chunk.id).join(', ')}, but it does not directly answer every part of the question.`
      : bestSentences.map(({ sentence, id }) => `${sentence} [${id}]`).join(' ');

  return {
    title: 'Grounded answer',
    body,
    citations: [...new Set(bestSentences.map(({ id }) => id))]
  };
};

const synthesizeUngroundedAnswer = (question: string): Answer => {
  if (question.trim().length === 0) {
    return {
      title: 'Ungrounded baseline',
      body: 'Without a question, there is nothing to answer.',
      citations: []
    };
  }

  return {
    title: 'Ungrounded baseline',
    body: 'A generic assistant might answer confidently from prior patterns, but this view intentionally withholds citations so you can see why unsupported answers are risky.',
    citations: []
  };
};

const buildQualityChecks = (selected: RetrievalResult[], question: string, answer: Answer): QualityCheck[] => {
  const bestScore = selected[0]?.score ?? 0;
  const questionTerms = new Set(tokenize(question));
  const selectedTerms = new Set(selected.flatMap((result) => tokenize(result.chunk.text)));
  const overlapCount = [...questionTerms].filter((term) => selectedTerms.has(term)).length;
  const coverage = questionTerms.size === 0 ? 0 : overlapCount / questionTerms.size;

  return [
    {
      label: 'Retrieval confidence',
      value: `${Math.round(bestScore * 100)}%`,
      tone: bestScore >= 0.22 ? 'good' : bestScore >= 0.1 ? 'warn' : 'bad',
      detail:
        bestScore >= 0.22
          ? 'The top chunk is a plausible match for the question.'
          : 'The top match is weak; the source may not contain a direct answer.'
    },
    {
      label: 'Evidence coverage',
      value: `${Math.round(coverage * 100)}%`,
      tone: coverage >= 0.55 ? 'good' : coverage >= 0.25 ? 'warn' : 'bad',
      detail:
        coverage >= 0.55
          ? 'Most important question terms appear in retrieved context.'
          : 'Several question terms are missing from the retrieved context.'
    },
    {
      label: 'Citation discipline',
      value: answer.citations.length > 0 ? `${answer.citations.length} chunk${answer.citations.length === 1 ? '' : 's'}` : 'No citations',
      tone: answer.citations.length > 0 ? 'good' : 'bad',
      detail:
        answer.citations.length > 0
          ? 'The grounded answer points back to source chunks.'
          : 'The answer should not make factual claims without citations.'
    },
    {
      label: 'Hallucination risk',
      value: bestScore >= 0.22 && answer.citations.length > 0 ? 'Lower' : 'Higher',
      tone: bestScore >= 0.22 && answer.citations.length > 0 ? 'good' : 'warn',
      detail:
        bestScore >= 0.22 && answer.citations.length > 0
          ? 'The answer is constrained by relevant retrieved evidence.'
          : 'Ask a more specific question or add source material that contains the answer.'
    }
  ];
};

const suggestNextStep = (checks: QualityCheck[]): string => {
  if (checks.some((check) => check.tone === 'bad')) {
    return 'Try adding clearer source text or asking a more specific question, then rerun the pipeline.';
  }
  if (checks.some((check) => check.tone === 'warn')) {
    return 'Inspect the selected chunks and decide whether the prompt needs stronger evidence instructions.';
  }
  return 'The pipeline found usable evidence. Try changing one word in the question and watch the scores move.';
};

const pickSentences = (text: string, question: string): string[] => {
  const terms = new Set(tokenize(question));
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) => {
      const score = tokenize(sentence).filter((term) => terms.has(term)).length;
      return { sentence, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((item) => item.score > 0)
    .map((item) => item.sentence);
};

const topTerms = (tokens: string[], limit: number): string[] => {
  const counts = new Map<string, number>();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
};

const projectPoint = (vector: number[], score: number, overlap: number, index: number): { x: number; y: number } => {
  const weighted = vector.reduce(
    (acc, value, termIndex) => {
      acc.x += Math.sin((termIndex + 1) * 1.7) * value;
      acc.y += Math.cos((termIndex + 1) * 2.1) * value;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: clamp(18 + score * 66 + ((weighted.x + index * 7) % 16), 8, 92),
    y: clamp(78 - overlap * 12 + ((weighted.y + index * 11) % 24), 8, 92)
  };
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
