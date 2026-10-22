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
  point: { x: number; y: number };
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
  topK: number;
  minScore: number;
};

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'by', 'can',
  'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how',
  'if', 'into', 'is', 'it', 'its', 'may', 'might', 'of', 'on', 'or', 'our',
  'should', 'the', 'their', 'then', 'there', 'these', 'this', 'those', 'to',
  'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will',
  'with', 'would', 'you', 'your'
]);

const SYSTEM_INSTRUCTION =
  'Teaching simulation only: use retrieved source excerpts as evidence, cite chunk ids for factual claims, and abstain when evidence is missing. This local demo does not call an LLM.';

export const tokenize = (text: string): string[] =>
  text
    .toLocaleLowerCase()
    .replace(/[’']/g, '')
    .match(/[\p{L}\p{N}]+/gu)
    ?.filter((token) => token.length > 1 && !STOP_WORDS.has(token)) ?? [];

/**
 * Splits on blank lines and preserves every non-empty block as content.
 * A short first block is not assumed to be a title: it may contain the only
 * relevant fact in a user's document. An explicit title can be added by the
 * UI in a future version without silently dropping source content.
 */
export const splitIntoChunks = (source: string): Chunk[] => {
  const blocks = source
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const tokens = tokenize(block);
    return {
      id: `C${index + 1}`,
      index,
      sourceLabel: 'Source document',
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

/**
 * Deterministic lexical baseline. Scores are cosine similarity over
 * log-scaled term frequency, not semantic embeddings or calibrated confidence.
 */
export const runPipeline = (
  source: string,
  question: string,
  topK = 3,
  minScore = 0.08
): PipelineRun => {
  const safeTopK = Number.isFinite(topK) ? Math.max(1, Math.floor(topK)) : 3;
  const safeMinScore = Number.isFinite(minScore) ? Math.max(0, minScore) : 0.08;
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
    .sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index)
    .map((result, index) => ({
      ...result,
      selected: index < safeTopK && result.score >= safeMinScore && result.score > 0
    }));

  const selected = ranked.filter((result) => result.selected);
  const prompt = assemblePrompt(selected, question);
  const groundedAnswer = synthesizeExtractiveAnswer(selected, question);
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
    nextStep: suggestNextStep(checks),
    topK: safeTopK,
    minScore: safeMinScore
  };
};

export const assemblePrompt = (selected: RetrievalResult[], question: string): PromptParts => {
  const context =
    selected.length === 0
      ? 'No relevant context retrieved. The correct behavior is to abstain rather than invent an answer.'
      : selected.map((result) => `[${result.chunk.id}] ${result.chunk.text}`).join('\n\n');

  return {
    system: SYSTEM_INSTRUCTION,
    context,
    question: question.trim() || 'No question provided.'
  };
};

const synthesizeExtractiveAnswer = (selected: RetrievalResult[], question: string): Answer => {
  if (question.trim().length === 0) {
    return {
      title: 'Extractive candidate (heuristic)',
      body: 'Enter a question to inspect candidate evidence.',
      citations: []
    };
  }

  if (selected.length === 0) {
    return {
      title: 'Extractive candidate (heuristic)',
      body: 'I cannot find matching source evidence with the current lexical retrieval settings. Abstain or add relevant source material.',
      citations: []
    };
  }

  const questionTerms = new Set(tokenize(question));
  const bestSentences = selected
    .flatMap((result) =>
      pickSentences(result.chunk.text, questionTerms).map((sentence) => ({
        sentence,
        id: result.chunk.id
      }))
    )
    .slice(0, 4);

  if (bestSentences.length === 0) {
    return {
      title: 'Extractive candidate (heuristic)',
      body: 'Some text was retrieved by lexical similarity, but no sentence passed the simple term-overlap rule. This is not evidence that the question has been answered; abstain or inspect the retrieved chunks.',
      citations: []
    };
  }

  return {
    title: 'Extractive candidate (heuristic)',
    body: bestSentences.map(({ sentence, id }) => `${sentence} [${id}]`).join(' '),
    citations: [...new Set(bestSentences.map(({ id }) => id))]
  };
};

const synthesizeUngroundedAnswer = (question: string): Answer => ({
  title: 'Unsupported baseline (illustration)',
  body: question.trim()
    ? 'This placeholder illustrates how an answer without an evidence trail can sound plausible. It is not an actual model response and intentionally makes no claim about the source.'
    : 'Enter a question to see why answers need evidence.',
  citations: []
});

const buildQualityChecks = (
  selected: RetrievalResult[],
  question: string,
  answer: Answer
): QualityCheck[] => {
  const bestScore = selected[0]?.score ?? 0;
  const questionTerms = new Set(tokenize(question));
  const selectedTerms = new Set(selected.flatMap((result) => tokenize(result.chunk.text)));
  const overlapCount = [...questionTerms].filter((term) => selectedTerms.has(term)).length;
  const coverage = questionTerms.size === 0 ? 0 : overlapCount / questionTerms.size;
  const hasExtractiveMatch = answer.citations.length > 0;

  return [
    {
      label: 'Top lexical similarity',
      value: `${Math.round(bestScore * 100)}%`,
      tone: bestScore >= 0.22 ? 'good' : bestScore >= 0.08 ? 'warn' : 'bad',
      detail: 'Cosine similarity from shared word-frequency vectors. This is not semantic similarity or a probability of correctness.'
    },
    {
      label: 'Question-term coverage',
      value: `${Math.round(coverage * 100)}%`,
      tone: coverage >= 0.55 ? 'good' : coverage >= 0.25 ? 'warn' : 'bad',
      detail: 'Share of distinct query terms found in retrieved text. It ignores word meaning, negation scope, and whether the text answers the question.'
    },
    {
      label: 'Citation references',
      value: answer.citations.length > 0
        ? `${answer.citations.length} chunk${answer.citations.length === 1 ? '' : 's'}`
        : 'None',
      tone: answer.citations.length > 0 ? 'good' : 'bad',
      detail: 'Counts source-chunk references in extracted sentences. A citation points to text; it does not prove that the text supports a claim.'
    },
    {
      label: 'Extractive match',
      value: hasExtractiveMatch ? 'Found' : 'Not found',
      tone: hasExtractiveMatch ? 'warn' : 'bad',
      detail: hasExtractiveMatch
        ? 'The heuristic found sentences with overlapping query terms. Review them for relevance, contradiction, and negation.'
        : 'No sentence passed the simple term-overlap rule. Treat the answer as unavailable rather than guessing.'
    }
  ];
};

const suggestNextStep = (checks: QualityCheck[]): string => {
  const similarity = checks.find((check) => check.label === 'Top lexical similarity');
  const extractive = checks.find((check) => check.label === 'Extractive match');
  if (extractive?.value !== 'Found') {
    return 'Inspect the source, add evidence that directly answers the question, or lower the retrieval threshold only if the retrieved text is genuinely relevant.';
  }
  if (similarity?.tone !== 'good') {
    return 'Inspect the selected chunks carefully. A lexical match is a lead for review, not proof that the answer is supported.';
  }
  return 'Open each cited chunk and verify that it directly supports the answer, including any negation or exceptions.';
};

const pickSentences = (text: string, questionTerms: Set<string>): string[] =>
  text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .map((sentence) => {
      const tokens = tokenize(sentence);
      const score = tokens.filter((term) => questionTerms.has(term)).length;
      return { sentence, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.sentence);

const topTerms = (tokens: string[], limit: number): string[] => {
  const counts = new Map<string, number>();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
};

/**
 * Coordinates are a deterministic illustrative layout, not a dimensionality
 * reduction and not meaningful semantic distances. They are for visual
 * orientation only; the numeric ranking above is the actual retrieval signal.
 */
const projectPoint = (
  vector: number[],
  score: number,
  overlap: number,
  index: number
): { x: number; y: number } => {
  const weighted = vector.reduce(
    (acc, value, termIndex) => {
      acc.x += Math.sin((termIndex + 1) * 1.7) * value;
      acc.y += Math.cos((termIndex + 1) * 2.1) * value;
      return acc;
    },
    { x: 0, y: 0 }
  );

  return {
    x: clamp(18 + score * 66 + (((weighted.x + index * 7) % 16) + 16) % 16, 8, 92),
    y: clamp(78 - overlap * 12 + (((weighted.y + index * 11) % 24) + 24) % 24, 8, 92)
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));
