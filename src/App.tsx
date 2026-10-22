import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  BrainCircuit,
  CheckCircle2,
  FileText,
  Network,
  Play,
  RotateCcw,
  Search,
  ShieldCheck
} from 'lucide-react';
import { scenarios, getScenario } from './data/scenarios';
import { runPipeline } from './lib/rag';
import type { PipelineRun } from './lib/rag';

const formatPercent = (score: number): string => `${Math.round(score * 100)}%`;

function App() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const scenario = getScenario(scenarioId);
  const [source, setSource] = useState(scenario.source);
  const [question, setQuestion] = useState(scenario.question);
  const [topK, setTopK] = useState(3);
  const [lastSource, setLastSource] = useState(scenario.source);
  const [lastQuestion, setLastQuestion] = useState(scenario.question);
  const [lastTopK, setLastTopK] = useState(3);
  const [lastRun, setLastRun] = useState<PipelineRun>(() =>
    runPipeline(scenario.source, scenario.question, 3)
  );

  const canRun = source.trim().length > 0 && question.trim().length > 0;
  const hasUnrunChanges = source !== lastSource || question !== lastQuestion || topK !== lastTopK;

  const execute = (nextSource: string, nextQuestion: string, nextTopK: number) => {
    setLastRun(runPipeline(nextSource, nextQuestion, nextTopK));
    setLastSource(nextSource);
    setLastQuestion(nextQuestion);
    setLastTopK(nextTopK);
  };

  const handleScenarioChange = (id: string) => {
    const next = getScenario(id);
    setScenarioId(id);
    setSource(next.source);
    setQuestion(next.question);
    setTopK(3);
    execute(next.source, next.question, 3);
  };

  const handleReset = () => {
    setSource(scenario.source);
    setQuestion(scenario.question);
    setTopK(3);
    execute(scenario.source, scenario.question, 3);
  };

  const handleRun = () => {
    if (canRun) execute(source, question, topK);
  };

  return (
    <>
      <a className="skip-link" href="#workspace-main">Skip to interactive workspace</a>
      <main className="app-shell" id="workspace-main" tabIndex={-1}>
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Build With AI: Basics</p>
          <h1 id="page-title">AI Basics Glassbox</h1>
          <p className="hero-copy">
            Explore a deterministic, local RAG teaching simulation. Inspect source chunks,
            lexical retrieval, prompt assembly, extractive candidates, and evidence limitations.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Last executed pipeline summary">
          <Metric label="Chunks" value={String(lastRun.chunks.length)} />
          <Metric label="Top lexical similarity" value={formatPercent(lastRun.selected[0]?.score ?? 0)} />
          <Metric label="Citation references" value={String(lastRun.groundedAnswer.citations.length)} />
        </div>
      </section>

      <section className="workspace" aria-label="RAG debugger workspace">
        <aside className="control-panel" aria-label="Controls">
          <PanelTitle icon={<BrainCircuit aria-hidden="true" />} title="Scenario" />
          <label className="field">
            <span>Lesson scenario</span>
            <select value={scenarioId} onChange={(event) => handleScenarioChange(event.target.value)}>
              {scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <p className="scenario-description">{scenario.description}</p>

          <label className="field">
            <span>Source document</span>
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              rows={15}
              spellCheck="true"
            />
          </label>

          <label className="field">
            <span>Question</span>
            <textarea
              className="question-input"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={3}
            />
          </label>

          <label className="field">
            <span>Chunks to retrieve (top-k)</span>
            <select value={topK} onChange={(event) => setTopK(Number(event.target.value))}>
              <option value={1}>1 chunk</option>
              <option value={3}>3 chunks</option>
              <option value={5}>5 chunks</option>
            </select>
          </label>
          <p className="field-help">
            Only chunks with a positive lexical score of at least 8% are selected. This fixed
            teaching threshold is not a confidence probability.
          </p>

          <div className="button-row">
            <button type="button" className="primary-button" onClick={handleRun} disabled={!canRun}>
              <Play size={18} aria-hidden="true" />
              Run
            </button>
            <button type="button" className="icon-button" onClick={handleReset} aria-label="Reset scenario">
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </div>

          {!canRun && <p className="warning-text">Add source text and a question to run the pipeline.</p>}
          {hasUnrunChanges ? (
            <p className="run-status changed" role="status">
              Inputs changed — results still show the last run. Select Run to update every panel.
            </p>
          ) : (
            <p className="run-status" role="status">Results match the current inputs.</p>
          )}
        </aside>

        <div className="pipeline-grid">
          <PipelineStrip />
          <ChunkInspector run={lastRun} />
          <RetrievalPanel run={lastRun} />
          <PromptPanel run={lastRun} />
          <AnswerPanel run={lastRun} />
          <QualityPanel run={lastRun} />
        </div>
      </section>
      </main>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function PanelTitle({ icon, title, titleId }: { icon: ReactNode; title: string; titleId?: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2 id={titleId}>{title}</h2>
    </div>
  );
}

function PipelineStrip() {
  const steps = [
    ['Chunk', FileText],
    ['Retrieve', Search],
    ['Assemble', Network],
    ['Extract', CheckCircle2],
    ['Inspect', ShieldCheck]
  ] as const;

  return (
    <section className="pipeline-strip" aria-label="Pipeline steps">
      {steps.map(([label, Icon], index) => (
        <div key={label} className="pipeline-step">
          <Icon size={18} aria-hidden="true" />
          <span>{label}</span>
          {index < steps.length - 1 && <span className="step-line" aria-hidden="true" />}
        </div>
      ))}
    </section>
  );
}

function ChunkInspector({ run }: { run: PipelineRun }) {
  const selectedIds = new Set(run.selected.map((result) => result.chunk.id));

  return (
    <section className="panel span-two" aria-labelledby="chunks-title">
      <PanelTitle icon={<FileText aria-hidden="true" />} title="1. Chunking Inspector" titleId="chunks-title" />
      <p className="panel-copy">
        Every non-empty paragraph is preserved as a chunk. A short first paragraph is not silently
        treated as a title and dropped.
      </p>
      <div className="chunk-list">
        {run.chunks.length === 0 ? (
          <p className="empty-state">No chunks. Add a source document with at least one non-empty paragraph, then Run.</p>
        ) : (
          run.chunks.map((chunk) => (
            <article className={`chunk-card ${selectedIds.has(chunk.id) ? 'selected' : ''}`} key={chunk.id}>
              <div className="chunk-meta">
                <span>{chunk.id}</span>
                <span>{chunk.tokenEstimate} estimated tokens</span>
                {selectedIds.has(chunk.id) && <span className="selected-label">Retrieved</span>}
              </div>
              <p>{chunk.text}</p>
              <div className="term-row" aria-label={`Top terms for ${chunk.id}`}>
                {chunk.topTerms.length > 0 ? chunk.topTerms.map((term) => (
                  <span key={term}>{term}</span>
                )) : <span>No indexable terms</span>}
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function RetrievalPanel({ run }: { run: PipelineRun }) {
  return (
    <section className="panel" aria-labelledby="retrieval-title">
      <PanelTitle icon={<Search aria-hidden="true" />} title="2. Retrieval" titleId="retrieval-title" />
      <p className="panel-copy">
        Log-scaled word-frequency vectors and cosine similarity rank lexical overlap. These are
        not semantic embeddings.
      </p>
      {run.retrieval.length === 0 ? (
        <p className="empty-state">No source chunks are available to rank.</p>
      ) : (
        <div className="score-list">
          {run.retrieval.map((result) => (
            <div key={result.chunk.id} className="score-row">
              <div>
                <strong>{result.chunk.id}</strong>
                <span>{result.selected ? 'selected for context' : 'not selected'}</span>
              </div>
              <div
                className="score-bar"
                role="progressbar"
                aria-label={`${result.chunk.id} lexical similarity`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(result.score * 100)}
              >
                <span style={{ width: `${Math.max(0, Math.min(100, result.score * 100))}%` }} />
              </div>
              <b>{formatPercent(result.score)}</b>
            </div>
          ))}
        </div>
      )}
      <p className="plot-note">
        Illustrative chunk map — coordinates are deterministic visual aids, not a semantic embedding
        or a meaningful distance scale.
      </p>
      <VectorPlot run={run} />
    </section>
  );
}

function VectorPlot({ run }: { run: PipelineRun }) {
  return (
    <svg className="vector-plot" viewBox="0 0 100 100" role="img" aria-label="Illustrative chunk map, not a semantic embedding">
      <rect x="0" y="0" width="100" height="100" rx="4" />
      <line x1="12" y1="82" x2="88" y2="82" />
      <line x1="12" y1="82" x2="12" y2="14" />
      <circle className="query-dot" cx="82" cy="24" r="4.5" />
      <text x="69" y="17">Query</text>
      {run.retrieval.map((result) => (
        <g key={result.chunk.id}>
          <circle
            className={result.selected ? 'selected-dot' : 'chunk-dot'}
            cx={result.point.x}
            cy={result.point.y}
            r={result.selected ? 4 : 3}
          />
          <text x={Math.min(result.point.x + 4, 93)} y={result.point.y + 1}>
            {result.chunk.id}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PromptPanel({ run }: { run: PipelineRun }) {
  return (
    <section className="panel" aria-labelledby="prompt-title">
      <PanelTitle icon={<Network aria-hidden="true" />} title="3. Prompt Assembly" titleId="prompt-title" />
      <p className="panel-copy">
        This is a prompt preview for learning. No model receives it: the application runs locally
        and uses a deterministic extractive heuristic.
      </p>
      <div className="prompt-box">
        <h3>Instruction (simulated)</h3>
        <p>{run.prompt.system}</p>
        <h3>Retrieved context</h3>
        <pre>{run.prompt.context}</pre>
        <h3>User question</h3>
        <p>{run.prompt.question}</p>
      </div>
    </section>
  );
}

function AnswerPanel({ run }: { run: PipelineRun }) {
  return (
    <section className="panel span-two" aria-labelledby="answers-title">
      <PanelTitle icon={<CheckCircle2 aria-hidden="true" />} title="4. Answer Comparison" titleId="answers-title" />
      <p className="panel-copy">
        The first card extracts sentences with overlapping query terms; it does not generate or
        verify a semantic answer. The second card is a placeholder illustration, not an LLM output.
      </p>
      <div className="answer-grid">
        <article className="answer-card grounded">
          <h3>{run.groundedAnswer.title}</h3>
          <p>{run.groundedAnswer.body}</p>
          <div className="citation-row" aria-label="Source chunk references">
            {run.groundedAnswer.citations.length === 0 ? (
              <span>No source references</span>
            ) : (
              run.groundedAnswer.citations.map((citation) => <span key={citation}>{citation}</span>)
            )}
          </div>
        </article>
        <article className="answer-card ungrounded">
          <h3>{run.ungroundedAnswer.title}</h3>
          <p>{run.ungroundedAnswer.body}</p>
          <div className="citation-row"><span>No evidence trail</span></div>
        </article>
      </div>
    </section>
  );
}

function QualityPanel({ run }: { run: PipelineRun }) {
  return (
    <section className="panel span-two" aria-labelledby="quality-title">
      <PanelTitle icon={<ShieldCheck aria-hidden="true" />} title="5. Evidence & Quality Checks" titleId="quality-title" />
      <p className="panel-copy">
        These are transparent lexical proxies, not calibrated confidence or hallucination
        probabilities. A citation identifies a source chunk but does not prove that it supports a claim.
      </p>
      <div className="check-grid">
        {run.checks.map((check) => (
          <article className={`check-card ${check.tone}`} key={check.label}>
            <span>{check.label}</span>
            <strong>{check.value}</strong>
            <p>{check.detail}</p>
          </article>
        ))}
      </div>
      <p className="next-step">{run.nextStep}</p>
    </section>
  );
}

export default App;
