---
status: approved
---

# Product Requirements

## Product Summary
AI Basics Glassbox is a single-page learning app that explains RAG by making each transformation visible. It prioritizes a complete, coherent product experience over infrastructure depth.

## Core Journey
1. The learner opens the app and sees a compact control panel, a source document editor, and a pipeline workspace.
2. The learner chooses a scenario or edits the source text and question.
3. The learner runs the pipeline.
4. The app shows chunk cards, similarity scores, a vector plot, selected prompt context, answer comparison, and grounding checks.
5. The learner changes input and immediately sees how retrieval and answer quality change.

## Features and Behavior

### Scenario Setup
Users can load realistic beginner-friendly scenarios. The app keeps the current scenario, source text, and question in state without requiring login or storage.

Acceptance criteria:
- A scenario selector updates the document and question.
- Users can edit source text and question directly.
- Reset restores the selected scenario.

### Chunking Inspector
The app splits the source document into compact chunks and shows each chunk with its source label, token estimate, and top terms.

Acceptance criteria:
- Chunks are visible before and after running.
- Empty or tiny source text produces a clear empty state.
- Each chunk has a stable identifier used across later views.

### Retrieval Visualizer
The app computes query-to-chunk cosine similarity with a deterministic local vectorizer and ranks chunks by score.

Acceptance criteria:
- Scores are shown as percentages and bars.
- Selected chunks are visually distinct.
- A 2D plot places the query and chunks so users can compare distance.

### Prompt Assembly
The app shows the actual prompt ingredients: system instruction, retrieved context, and user question.

Acceptance criteria:
- Retrieved context lists only selected chunks.
- The prompt view updates when the question or document changes.
- Copy text is plain and readable.

### Grounded Answer Comparison
The app presents a grounded answer based on retrieved evidence beside an intentionally ungrounded baseline.

Acceptance criteria:
- The grounded answer cites chunk ids.
- The ungrounded answer clearly lacks evidence.
- Both answers are generated locally for safe offline demos.

### Quality Checks
The app reports evidence coverage, retrieval confidence, hallucination risk, and prompt sensitivity guidance.

Acceptance criteria:
- Checks are understandable without AI jargon.
- Checks react to weak or missing retrieval.
- The app explains what to try next.

## Look and Feel
The interface should feel like a serious learning instrument: dark text on a warm neutral canvas, strong data colors, compact panels, visible flow, no generic chatbot look. It should be polished enough for a short demo and dense enough to reward inspection.

## Empty and Error States
- Empty source text: show that there is nothing to chunk and disable misleading results.
- Empty question: ask the learner to enter a question.
- Weak retrieval: show the answer as low confidence and explain that the source may not contain the answer.

## Deferred
- Authentication
- File upload
- Server-side model calls
- Persistent project history
- Multi-agent orchestration
