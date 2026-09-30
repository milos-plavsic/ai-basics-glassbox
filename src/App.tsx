import { useMemo, useState } from 'react';
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
  const [lastRun, setLastRun] = useState<PipelineRun>(() => runPipeline(scenario.source, scenario.question));

  const previewRun = useMemo(() => runPipeline(source, question), [source, question]);
  const hasQuestion = question.trim().length > 0;
  const canRun = hasQuestion && source.trim().length > 0;

  const handleScenarioChange = (id: string) => {
    const next = getScenario(id);
    setScenarioId(id);
    setSource(next.source);
    setQuestion(next.question);
    setLastRun(runPipeline(next.source, next.question));
  };

  const handleReset = () => {
    setSource(scenario.source);
    setQuestion(scenario.question);
    setLastRun(runPipeline(scenario.source, scenario.question));
  };

  const handleRun = () => {
    if (canRun) {
      setLastRun(runPipeline(source, question));
    }
  };

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Build With AI: Basics</p>
          <h1 id="page-title">AI Basics Glassbox</h1>
          <p className="hero-copy">
            Ask one question, then inspect the RAG pipeline that turns source text into chunks,
            retrieval scores, prompt context, and a cited answer.
          </p>
        </div>
        <div className="hero-metrics" aria-label="Pipeline summary">
          <Metric label="Chunks" value={String(lastRun.chunks.length)} />
          <Metric label="Top score" value={formatPercent(lastRun.retrieval[0]?.score ?? 0)} />
          <Metric label="Citations" value={String(lastRun.groundedAnswer.citations.length)} />
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
        </aside>

        <div className="pipeline-grid">
          <PipelineStrip />
          <ChunkInspector run={previewRun} executedRun={lastRun} />
          <RetrievalPanel run={lastRun} />
          <PromptPanel run={lastRun} />
          <AnswerPanel run={lastRun} />
          <QualityPanel run={lastRun} />
        </div>
      </section>
    </main>
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

function PanelTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="panel-title">
      {icon}
      <h2>{title}</h2>
    </div>
  );
}

function PipelineStrip() {
  const steps = [
    ['Chunk', FileText],
    ['Retrieve', Search],
    ['Assemble', Network],
    ['Answer', CheckCircle2],
    ['Check', ShieldCheck]
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

function ChunkInspector({ run, executedRun }: { run: PipelineRun; executedRun: PipelineRun }) {
  const selectedIds = new Set(executedRun.selected.map((result) => result.chunk.id));

  return (
    <section className="panel span-two" aria-labelledby="chunks-title">
      <PanelTitle icon={<FileText aria-hidden="true" />} title="1. Chunking Inspector" />
      <p className="panel-copy">The source document is split into small retrievable pieces before search starts.</p>
      <div className="chunk-list">
        {run.chunks.length === 0 ? (
          <p className="empty-state">No chunks yet. Add a source document with at least one paragraph.</p>
        ) : (
          run.chunks.map((chunk) => (
            <article className={`chunk-card ${selectedIds.has(chunk.id) ? 'selected' : ''}`} key={chunk.id}>
              <div className="chunk-meta">
                <span>{chunk.id}</span>
                <span>{chunk.tokenEstimate} tokens</span>
              </div>
              <p>{chunk.text}</p>
              <div className="term-row" aria-label={`Top terms for ${chunk.id}`}>
                {chunk.topTerms.map((term) => (
                  <span key={term}>{term}</span>
                ))}
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
      <PanelTitle icon={<Search aria-hidden="true" />} title="2. Retrieval" />
      <p className="panel-copy">Cosine similarity ranks which chunks look closest to the question.</p>
      <div className="score-list">
        {run.retrieval.map((result) => (
          <div key={result.chunk.id} className="score-row">
            <div>
              <strong>{result.chunk.id}</strong>
              <span>{result.selected ? 'selected for prompt' : 'not selected'}</span>
            </div>
            <div className="score-bar" aria-label={`${result.chunk.id} score ${formatPercent(result.score)}`}>
              <span style={{ width: `${Math.max(3, result.score * 100)}%` }} />
            </div>
            <b>{formatPercent(result.score)}</b>
          </div>
        ))}
      </div>
      <VectorPlot run={run} />
    </section>
  );
}

function VectorPlot({ run }: { run: PipelineRun }) {
  return (
    <svg className="vector-plot" viewBox="0 0 100 100" role="img" aria-label="2D similarity plot">
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
          <text x={result.point.x + 4} y={result.point.y + 1}>
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
      <PanelTitle icon={<Network aria-hidden="true" />} title="3. Prompt Assembly" />
      <p className="panel-copy">The answer sees only the instruction, retrieved context, and question.</p>
      <div className="prompt-box">
        <h3>System</h3>
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
      <PanelTitle icon={<CheckCircle2 aria-hidden="true" />} title="4. Answer Comparison" />
      <p className="panel-copy">Compare a cited answer with a baseline that has no evidence trail.</p>
      <div className="answer-grid">
        <article className="answer-card grounded">
          <h3>{run.groundedAnswer.title}</h3>
          <p>{run.groundedAnswer.body}</p>
          <div className="citation-row">
            {run.groundedAnswer.citations.length === 0 ? (
              <span>No citations</span>
            ) : (
              run.groundedAnswer.citations.map((citation) => <span key={citation}>{citation}</span>)
            )}
          </div>
        </article>
        <article className="answer-card ungrounded">
          <h3>{run.ungroundedAnswer.title}</h3>
          <p>{run.ungroundedAnswer.body}</p>
          <div className="citation-row">
            <span>No evidence trail</span>
          </div>
        </article>
      </div>
    </section>
  );
}

function QualityPanel({ run }: { run: PipelineRun }) {
  return (
    <section className="panel span-two" aria-labelledby="quality-title">
      <PanelTitle icon={<ShieldCheck aria-hidden="true" />} title="5. Quality Checks" />
      <p className="panel-copy">Simple checks show whether the answer is supported enough to trust.</p>
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
