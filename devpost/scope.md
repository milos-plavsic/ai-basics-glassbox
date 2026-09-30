---
status: approved
---

# Scope

## Project Name
AI Basics Glassbox

## The Unique Kernel
Beginners can ask one question and watch the RAG pipeline assemble an answer in plain sight: source text becomes chunks, chunks receive similarity scores, the top matches become prompt context, and the final answer can be compared with an ungrounded answer.

## Intended User
People learning AI basics who have heard about embeddings, vector search, and RAG but have not seen how those parts affect an answer.

## The Core Loop
1. Pick or edit a small knowledge base.
2. Ask a question.
3. Run the glassbox pipeline.
4. Inspect chunks, scores, prompt context, answer comparison, and grounding checks.
5. Adjust the question or source text and rerun.

## What "Working" Looks Like
A reviewer can open the app locally, ask "How does the refund policy work?", and see the full retrieval path from source text through ranked chunks to a grounded answer and visible quality checks.

## The POC Boundary
Build one polished browser app with deterministic local retrieval and answer synthesis. No accounts, no server, no external model key, no hosted database, and no multi-agent framework.

## Now
- Editable source document
- Question input and example scenarios
- Transparent chunking
- Local vector-style retrieval with cosine similarity
- Prompt assembly view
- Grounded vs ungrounded answer comparison
- Evidence and quality checks
- Responsive, accessible visual interface

## Later
- Real embedding model integration
- Optional LLM provider bridge
- Multi-document upload
- Collaborative lessons
- Agent workflow debugger

## Explicitly Cut
- Full multi-agent terminal
- Backend orchestration service
- 3D embedding visualization
- User accounts
- Production RAG hosting
