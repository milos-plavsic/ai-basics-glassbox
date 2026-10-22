# Release QA checklist

Use this checklist before announcing a public demo. Automated CI verifies the application build and behavior, but it does not replace browser, assistive-technology, or visual review.

## Responsive layout
- [ ] Check at 320 × 568, 375 × 812, 768 × 1024, 1280 × 800, and 1440 × 900.
- [ ] Confirm there is no horizontal page overflow and every control remains reachable.
- [ ] Confirm the controls panel stops being sticky at tablet/mobile widths and does not cover results.
- [ ] Zoom to 200% and verify the reading and interaction order still makes sense.
- [ ] Test a long source paragraph, many source chunks, and long question text.

## Keyboard-only operation
- [ ] Reload and press Tab: the “Skip to interactive workspace” link should become visible.
- [ ] Activate the skip link and confirm focus/navigation lands at the workspace.
- [ ] Use Tab and Shift+Tab through scenario, source, question, top-k, Run, and Reset.
- [ ] Verify every focused control has a clearly visible focus indicator.
- [ ] Change the scenario and execute/reset the pipeline without using a pointer.

## Screen reader and semantics
- [ ] Verify the page title and section headings form a useful outline.
- [ ] Verify each select and textarea announces its visible label.
- [ ] Edit inputs and run the pipeline; confirm the stale/current result status is announced.
- [ ] Confirm each retrieval progress bar exposes its chunk label and numeric value.
- [ ] Confirm the illustrative SVG is announced as an illustrative chunk map, not a semantic embedding.
- [ ] Check with at least one desktop screen reader (NVDA or VoiceOver) and, if available, a mobile screen reader.

## Visual accessibility
- [ ] Check text, controls, focus indicators, and meaningful graphical elements for WCAG AA contrast.
- [ ] Check Windows High Contrast / forced-colors mode: selected chunks and score bars should remain distinguishable.
- [ ] Verify meaning is not conveyed by color alone; read the labels and explanatory copy.
- [ ] Confirm text remains readable at browser zoom and with system font scaling.

## Release and deployment
- [ ] Confirm the latest main CI run passes: install, audit, typecheck, tests, production build, Docker build, and SPA fallback smoke test.
- [ ] If deploying, use a platform that serves the built SPA and supports fallback routing for client-side paths.
- [ ] Verify the deployed root page and a non-root route load successfully over HTTPS.
- [ ] Test the deployed build on mobile and desktop; do not treat a successful Docker smoke test as visual QA.
- [ ] Add a current screenshot or short demo clip to the README only after checking it matches the live UI.
- [ ] State clearly that this is an offline lexical RAG simulation, not a live LLM, vector database, or hallucination detector.

## Findings

Record the date, browser/device, assistive technology, viewport, result, and a reproduction note for each issue. Do not mark the checklist complete based only on CI.
