---
status: approved
mode: fast
---

# Build Checklist

## Slices

- [x] **1. Local RAG pipeline produces inspectable evidence**
  Becomes usable: The project can chunk a source document, rank chunks against a query, build a prompt, synthesize a grounded answer, and report quality checks.
  Why now: This proves the unique kernel before styling or polish.
  PRD ref: `prd.md > Chunking Inspector`, `prd.md > Retrieval Visualizer`, `prd.md > Prompt Assembly`, `prd.md > Grounded Answer Comparison`, `prd.md > Quality Checks`
  Spec ref: `spec.md > Data Model`, `spec.md > Security and Privacy`
  Build: Implement deterministic RAG utilities and unit tests.
  Verify (mechanical): `npm test -- src/lib/rag.test.ts`
  Learner check: Read the test names and confirm the pipeline behavior matches the intended demo.
  Commit: Implement local RAG pipeline

- [x] **2. Browser app exposes the full glassbox journey**
  Becomes usable: A learner can edit source text and question, run the pipeline, and inspect every stage in one responsive app.
  Why now: This turns the kernel into the visible product experience judges evaluate.
  PRD ref: `prd.md > Core Journey`, `prd.md > Scenario Setup`
  Spec ref: `spec.md > App Shell`, `spec.md > Control Panel`, `spec.md > File Structure`
  Build: Build React components, scenario state, input controls, panels, and responsive styling.
  Verify (mechanical): `npm test -- src/App.test.tsx`
  Learner check: Run the app, select scenarios, edit the question, and confirm every panel updates.
  Commit: Build glassbox interface

- [x] **3. Submission-ready polish and documentation**
  Becomes usable: The repo has setup instructions, tests, production build, accessibility labels, and Devpost planning docs.
  Why now: A clear demo and public repo matter because reviewers may judge from the video and write-up.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Empty and Error States`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`
  Build: Add README, final copy polish, verification, and app map.
  Verify (mechanical): `npm test && npm run typecheck && npm run build`
  Learner check: Record a 1-3 minute demo around the refund-policy scenario.
  Commit: Prepare hackathon submission materials

## Hands-on Checkpoints
- [x] Early checkpoint after the interface first runs: verify that the RAG stages are understandable at a glance.

## Final Review
- [x] Final verification passed with tests, typecheck, and production build.

## Code Tour and App Map
- [x] App map created at `devpost/app-map.html`.

## Revisions
- Kept the product browser-only and deterministic to preserve a zero-key judge experience.
