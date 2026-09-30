export type Scenario = {
  id: string;
  title: string;
  description: string;
  source: string;
  question: string;
};

export const scenarios: Scenario[] = [
  {
    id: 'refunds',
    title: 'Refund Policy',
    description: 'A realistic support question where grounding prevents confident guessing.',
    question: 'How does the refund policy work for a damaged order?',
    source: `Northstar Supply Help Center

Refund windows
Customers can request a refund within 30 days of delivery. Refunds are returned to the original payment method after the warehouse confirms the item has been received.

Damaged orders
If an item arrives damaged, the customer should contact support within 7 days and include a photo of the damage. Support can offer either a replacement or a refund without requiring the customer to ship the damaged item back.

Final sale items
Final sale items cannot be returned for preference-based reasons such as color, size, or a change of mind. If a final sale item arrives damaged, the damaged-order policy still applies.

Processing time
Approved refunds usually appear within 5 to 8 business days after approval. Bank processing delays can add 2 additional business days.

Shipping fees
Standard outbound shipping fees are not refunded for preference-based returns. Shipping fees are refunded when the return is caused by a damaged, defective, or incorrect item.`
  },
  {
    id: 'study',
    title: 'AI Study Notes',
    description: 'A small lesson showing how retrieval picks the parts that match a concept question.',
    question: 'Why does RAG reduce hallucination risk?',
    source: `AI Basics Study Notes

Embeddings
An embedding is a list of numbers that represents text in a way that makes similar meaning easier to compare. Embeddings do not understand truth by themselves; they make retrieval possible.

Vector search
Vector search compares a query vector to document vectors. Cosine similarity is a common measure because it compares direction instead of raw length.

RAG
Retrieval-augmented generation, or RAG, first retrieves relevant source passages and then asks a model to answer using those passages. RAG can reduce hallucination risk because the answer is tied to evidence the system found.

Prompt assembly
The final prompt usually contains a system instruction, retrieved context, and the user's question. Clear instructions can tell the model to say when the evidence is missing.

Evaluation
Good AI systems are checked. A basic RAG check asks whether the answer uses retrieved evidence, whether the retrieved evidence actually matches the question, and whether the answer adds unsupported claims.`
  },
  {
    id: 'garden',
    title: 'Community Garden',
    description: 'A friendly non-technical example with overlapping facts and edge cases.',
    question: 'Can members bring guests to weekend workshops?',
    source: `Community Garden Member Guide

Membership
Members may reserve one garden bed per season. Reservations are confirmed by email and expire if the member misses the first orientation.

Workshops
Weekend workshops are open to active members. Members may bring one guest to workshops if they register the guest at least 24 hours before the session.

Tool shed
The tool shed is unlocked during staffed hours. Guests may not borrow tools unless a member is present and accepts responsibility for returning them.

Harvest share
Members can donate extra produce to the Sunday harvest table. Guests can help with harvest sorting but cannot take produce before members have made their selections.

Weather policy
Outdoor workshops are canceled if lightning is forecast within 10 miles. Canceled workshops are rescheduled within two weeks when possible.`
  }
];

export const getScenario = (id: string): Scenario => {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
};
