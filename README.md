# AI Basics Glassbox

**A small, offline-first teaching lab for inspecting the mechanics and limitations of retrieval-augmented generation (RAG).**

AI Basics Glassbox lets you edit a source document and question, run a deterministic local retrieval pipeline, inspect selected excerpts, and see why lexical matches and citations are not proof that an answer is correct. It needs no API key, account, or remote model.

## What you can learn

- **Chunking:** how blank-line-separated source blocks become retrievable chunks.
- **Lexical retrieval:** how log-scaled word counts and cosine similarity rank chunks.
- **Prompt assembly:** how an instruction, retrieved context, and question can be arranged.
- **Extractive candidates:** how a simple word-overlap heuristic selects source sentences.
- **Evidence review:** why retrieval scores, query-term coverage, and citation references are useful diagnostics—but not truth detectors.
- **Abstention:** what the system does when it cannot find matching evidence.

## What this project is—and is not

This is a deterministic, client-side educational simulation. It does **not** call an LLM, create semantic embeddings, use a vector database, or verify whether a cited passage entails an answer. Its cosine similarity uses local term-frequency vectors. The answer panel extracts sentences with overlapping query terms; it does not perform natural-language generation or reliable semantic reasoning.

The plotted chunk coordinates are illustrative visual aids, not a real embedding projection. Score thresholds are teaching heuristics, not calibrated confidence or hallucination probabilities. A citation points to a source chunk but does not prove that the chunk supports the claim. Negation, synonyms, multi-part questions, and misleading lexical overlap can fool this baseline.

These limits are intentional and visible so that beginners can experiment safely without credentials or opaque remote behavior.

## Run locally

Requirements: Node.js 22 (recommended) and npm.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Verify a change

```bash
npm ci
npm run typecheck
npm test
npm run build
```

The GitHub Actions workflow runs the same checks on pushes and pull requests. Review dependency audit findings individually; a reported package issue should be evaluated for reachability and remediation rather than ignored or blindly forced through a potentially breaking upgrade.

## Run with Docker

```bash
docker build -t ai-basics-glassbox .
docker run --rm -p 8080:80 ai-basics-glassbox
```

Then open http://localhost:8080. The container serves the static Vite build through Nginx and includes a single-page-app fallback. Rebuild periodically to receive base-image security updates.

## Three useful experiments

### 1. A direct answer with evidence
Choose **Refund Policy** and ask: `How does the refund policy work for a damaged order?`. Inspect the damaged-order chunk, prompt context, and extracted sentence. Check the actual text before deciding whether it answers every part of the question.

### 2. Missing evidence
Ask: `What is the warranty on laptops?`. The source does not discuss laptop warranties. Observe whether lexical retrieval abstains and how the empty evidence trail differs from a grounded answer.

### 3. Lexical overlap can mislead
Ask a question that shares words with a source paragraph but changes its meaning, such as asking whether gift cards *can* be refunded when the text says they *cannot*. Inspect whether the sentence is selected and notice that the heuristic does not reason reliably about negation or entailment.

## Project layout

- `src/lib/rag.ts` — deterministic chunking, lexical retrieval, prompt preview, extractive heuristic, and diagnostic checks.
- `src/lib/rag.test.ts` — core algorithm and regression tests.
- `src/data/scenarios.ts` — editable lesson examples.
- `src/App.tsx` — interactive workspace.
- `src/App.test.tsx` — UI state and interaction tests.
- `.github/workflows/ci.yml` — repeatable CI verification.
- `Dockerfile`, `nginx.conf` — static container deployment.

## Scope

The first release intentionally excludes hosted LLM calls, API-key management, accounts, a backend, cloud persistence, and a production hallucination detector. Those would add cost and complexity without improving the core beginner lesson.

## License

See [LICENSE](LICENSE) for the project license.
