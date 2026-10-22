import { describe, expect, it } from 'vitest';
import {
  cosineSimilarity,
  runPipeline,
  splitIntoChunks,
  tokenize
} from './rag';

const source = `Support guide

Refunds are available within 30 days of delivery.

Damaged orders can be refunded without return shipping when the customer sends a photo within 7 days.

Gift cards are final sale and cannot be refunded.`;

describe('RAG teaching pipeline', () => {
  it('tokenizes useful terms, removes filler, and preserves negation', () => {
    expect(tokenize('How does the refund policy work?')).toEqual(['refund', 'policy', 'work']);
    expect(tokenize('Refunds are not available')).toContain('not');
    expect(tokenize('Do not refund a café order')).toContain('café');
  });

  it('preserves a short first paragraph instead of guessing it is a title', () => {
    const chunks = splitIntoChunks('Refunds end after 30 days.\n\nMore policy details follow here.');
    expect(chunks).toHaveLength(2);
    expect(chunks[0].text).toBe('Refunds end after 30 days.');
    expect(chunks[0].id).toBe('C1');
  });

  it('normalizes CRLF and ignores empty blocks without losing content', () => {
    const chunks = splitIntoChunks('\r\nShort fact.\r\n\r\n\r\nSecond fact.\r\n');
    expect(chunks.map((chunk) => chunk.text)).toEqual(['Short fact.', 'Second fact.']);
  });

  it('returns no chunks for blank source and handles one long paragraph', () => {
    expect(splitIntoChunks('  \n\n ')).toEqual([]);
    const longParagraph = 'policy '.repeat(300).trim();
    expect(splitIntoChunks(longParagraph)).toHaveLength(1);
    expect(splitIntoChunks(longParagraph)[0].text).toBe(longParagraph);
  });

  it('computes cosine similarity safely for zero and mismatched vectors', () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBe(1);
    expect(cosineSimilarity([0, 0], [1, 0])).toBe(0);
    expect(cosineSimilarity([1], [1, 1])).toBeCloseTo(1 / Math.sqrt(2), 10);
  });

  it('retrieves source evidence and cites the chunk containing the sentence', () => {
    const run = runPipeline(source, 'Can damaged orders get a refund?');
    const damagedChunk = run.chunks.find((chunk) => chunk.text.startsWith('Damaged orders'));
    expect(run.selected.some((result) => result.chunk.id === damagedChunk?.id)).toBe(true);
    expect(run.groundedAnswer.body).toContain(damagedChunk?.text.split('.')[0]);
    expect(run.groundedAnswer.body).toContain(`[${damagedChunk?.id}]`);
    expect(run.prompt.context).toContain(`[${damagedChunk?.id}]`);
  });

  it('abstains when the source contains no terms relevant to the question', () => {
    const run = runPipeline(source, 'What is the warranty on laptops?');
    expect(run.selected).toHaveLength(0);
    expect(run.groundedAnswer.citations).toEqual([]);
    expect(run.groundedAnswer.body).toMatch(/cannot find matching source evidence/i);
    expect(run.checks.find((check) => check.label === 'Extractive match')?.value).toBe('Not found');
  });

  it('does not treat a citation as proof of factual support', () => {
    const run = runPipeline(source, 'Can damaged orders get a refund?');
    const citationCheck = run.checks.find((check) => check.label === 'Citation references');
    const extractiveCheck = run.checks.find((check) => check.label === 'Extractive match');
    expect(citationCheck?.detail).toMatch(/does not prove/i);
    expect(extractiveCheck?.tone).toBe('warn');
  });

  it('keeps negation words in the query vocabulary', () => {
    expect(tokenize('Is this item not refundable?')).toContain('not');
    expect(tokenize('Can I never return this?')).toContain('never');
  });

  it('handles empty and stop-word-only questions without selecting chunks', () => {
    expect(runPipeline(source, '').selected).toHaveLength(0);
    expect(runPipeline(source, 'how does it work').selected).toHaveLength(0);
  });

  it('respects top-k and a configurable minimum lexical score', () => {
    const topOne = runPipeline(source, 'refund damaged order', 1, 0);
    expect(topOne.selected).toHaveLength(1);
    expect(runPipeline(source, 'refund damaged order', 3, 1.1).selected).toHaveLength(0);
  });

  it('keeps tie ordering deterministic', () => {
    const run = runPipeline('Refunds are available.\n\nRefunds are available.', 'refunds', 2, 0);
    expect(run.retrieval.map((result) => result.chunk.index)).toEqual([0, 1]);
  });
});


describe('deterministic retrieval evaluation fixtures', () => {
  const fixtures = [
    { name: 'refund window', source: 'Refunds are available within 30 days.', question: 'refunds 30 days', expected: 'Refunds are available' },
    { name: 'guest access', source: 'Members may bring one guest.', question: 'members guest', expected: 'one guest' },
    { name: 'lightning cancellation', source: 'Lightning cancels outdoor workshops.', question: 'lightning workshops', expected: 'Lightning cancels' },
    { name: 'shipping refund', source: 'Shipping fees are refunded for damaged items.', question: 'shipping fees damaged', expected: 'Shipping fees' },
    { name: 'gift card restriction', source: 'Gift cards cannot be refunded.', question: 'gift cards refunded', expected: 'Gift cards cannot' },
    { name: 'cosine similarity', source: 'Cosine similarity compares vector direction.', question: 'cosine vector direction', expected: 'Cosine similarity' },
    { name: 'embedding representation', source: 'Embeddings are lists of numbers.', question: 'embeddings numbers', expected: 'Embeddings are' },
    { name: 'workshop registration', source: 'Weekend workshops require registration.', question: 'weekend workshops registration', expected: 'Weekend workshops' },
    { name: 'refund processing', source: 'Approved refunds appear in five business days.', question: 'approved refunds days', expected: 'Approved refunds' },
    { name: 'tool borrowing', source: 'Guests cannot borrow tools.', question: 'guests borrow tools', expected: 'Guests cannot' },
    { name: 'shed hours', source: 'The tool shed is unlocked during staffed hours.', question: 'tool shed staffed hours', expected: 'tool shed' },
    { name: 'bank delays', source: 'Bank delays can add two business days.', question: 'bank delays business days', expected: 'Bank delays' },
    { name: 'final sale return', source: 'Final sale items cannot be returned.', question: 'final sale returned', expected: 'Final sale items' },
    { name: 'chunking mechanics', source: 'Source text is split into chunks.', question: 'source text chunks', expected: 'Source text' },
    { name: 'lexical baseline', source: 'The system uses a local lexical baseline.', question: 'local lexical baseline', expected: 'local lexical baseline' }
  ];

  it.each(fixtures)('retrieves and cites the expected evidence: $name', ({ source, question, expected }) => {
    const run = runPipeline(source, question);
    expect(run.selected).toHaveLength(1);
    expect(run.selected[0].chunk.text).toContain(expected);
    expect(run.groundedAnswer.body).toContain(expected);
    expect(run.groundedAnswer.citations).toContain(run.selected[0].chunk.id);
  });
});
