import { describe, expect, it } from 'vitest';
import { cosineSimilarity, runPipeline, splitIntoChunks, tokenize } from './rag';

const source = `Support guide

Refunds are available within 30 days of delivery.

Damaged orders can be refunded without return shipping when the customer sends a photo within 7 days.

Gift cards are final sale and cannot be refunded.`;

describe('rag pipeline', () => {
  it('tokenizes meaningful terms without common filler', () => {
    expect(tokenize('How does the refund policy work?')).toEqual(['does', 'refund', 'policy', 'work']);
  });

  it('splits source text into stable chunks', () => {
    const chunks = splitIntoChunks(source);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toMatchObject({ id: 'C1', sourceLabel: 'Support guide' });
  });

  it('computes cosine similarity safely', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
  });

  it('retrieves the damaged-order evidence and cites it', () => {
    const run = runPipeline(source, 'Can damaged orders get a refund?');
    expect(run.selected[0].chunk.text).toContain('Damaged orders');
    expect(run.groundedAnswer.body).toContain('[C2]');
    expect(run.prompt.context).toContain('[C2]');
  });

  it('marks weak retrieval as a risk', () => {
    const run = runPipeline(source, 'What is the warranty on laptops?');
    expect(run.checks.some((check) => check.label === 'Hallucination risk')).toBe(true);
  });
});
