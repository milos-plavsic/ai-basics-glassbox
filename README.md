# AI Basics Glassbox

AI Basics Glassbox is a browser-based RAG debugger for beginners. It shows how a question moves through chunking, vector-style retrieval, prompt assembly, answer generation, and quality checks without requiring an API key or account.

## What It Does

- Splits an editable source document into inspectable chunks.
- Ranks chunks with deterministic local cosine similarity.
- Visualizes retrieval scores and a 2D similarity plot.
- Shows the exact prompt ingredients used for the answer.
- Compares a grounded, cited answer with an unsupported baseline.
- Reports retrieval confidence, evidence coverage, citation discipline, and hallucination risk.

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL shown in the terminal.

## Verify

```bash
npm test
npm run typecheck
npm run build
```

## Optional Docker Run

```bash
docker build -t ai-basics-glassbox .
docker run --rm -p 8080:80 ai-basics-glassbox
```

## Demo Script

Use the **Refund Policy** scenario.

1. Ask: `How does the refund policy work for a damaged order?`
2. Run the pipeline.
3. Show the selected damaged-order and shipping-fee chunks.
4. Open the prompt panel and point out the retrieved context.
5. Compare the cited grounded answer with the unsupported baseline.
6. End on the quality checks and explain what a learner should try next.

## Notes

This proof of concept uses a local deterministic retrieval model so reviewers can run it without credentials. It is a teaching model for RAG mechanics, not a production LLM stack.
