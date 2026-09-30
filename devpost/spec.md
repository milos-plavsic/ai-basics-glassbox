---
status: approved
---

# Technical Specification

## How This Works, In Plain Language
The app is a local teaching model of RAG. It does not hide work behind a chat box. It turns the source text into chunks, turns the chunks and question into comparable vectors, ranks chunks by cosine similarity, builds a visible prompt from the top matches, and creates a grounded extractive answer from the retrieved evidence.

## Stack
- Vite, React, and TypeScript for a small, fast browser app.
- Local deterministic retrieval logic in TypeScript.
- SVG and CSS for visualization instead of heavyweight chart libraries.
- Vitest and Testing Library for mechanical checks.

Docs:
- Vite: https://vite.dev/
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Vitest: https://vitest.dev/

## Components

### App Shell
Implements `prd.md > Core Journey`.
Coordinates scenario state, source edits, question edits, pipeline execution, and all panels.

### Control Panel
Implements `prd.md > Scenario Setup`.
Contains scenario selection, reset, run, and learner inputs.

### Chunk Inspector
Implements `prd.md > Chunking Inspector`.
Renders chunk cards with token estimate, top terms, and retrieval status.

### Retrieval Visualizer
Implements `prd.md > Retrieval Visualizer`.
Displays score bars and a 2D SVG plot for the query and chunk vectors.

### Prompt Panel
Implements `prd.md > Prompt Assembly`.
Shows system instruction, retrieved context, and question.

### Answer Comparison
Implements `prd.md > Grounded Answer Comparison`.
Displays grounded and ungrounded answers side by side.

### Quality Panel
Implements `prd.md > Quality Checks`.
Summarizes confidence, evidence coverage, hallucination risk, and suggested next step.

## Data Model
- `Scenario`: id, title, description, source text, question.
- `Chunk`: id, source label, text, token estimate, top terms.
- `RetrievalResult`: chunk plus score, selected flag, and plot position.
- `PipelineRun`: chunks, ranked results, prompt, answers, and quality checks.

## File Structure
- `src/App.tsx`: stateful app composition.
- `src/components/`: visual panels.
- `src/data/scenarios.ts`: sample scenarios.
- `src/lib/rag.ts`: chunking, vectorization, retrieval, prompt assembly, answer synthesis, checks.
- `src/styles/app.css`: complete responsive interface styling.
- `src/lib/rag.test.ts`: deterministic pipeline tests.
- `src/App.test.tsx`: user-facing behavior tests.

## Security and Privacy
The app runs entirely in the browser with bundled sample data. It makes no network requests, stores no secrets, and does not require user accounts. `.env` files and learner profile notes are ignored.

## Where It Runs and How Someone Tries It
Install dependencies with `npm install`, then run `npm run dev` and open the local Vite URL. For verification, run `npm test`, `npm run typecheck`, and `npm run build`.

## Decisions and Open Issues
- Use local vector-style retrieval rather than a hosted embedding model so judges can run the project without API keys.
- Clearly label answer synthesis as a teaching model, not a replacement for a production LLM.
- Keep the proof of concept focused on one strong RAG journey.
