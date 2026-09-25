/**
 * Embeddings + retrieval for "Ask LOOP" (AI3).
 *
 * The spec allows pgvector OR a hosted embeddings provider. To keep the
 * project runnable with a single GEMINI_API_KEY (no second vendor key
 * required), we compute embeddings locally with feature-hashed TF vectors
 * and rank by cosine similarity. This is swappable: replace `embedText`
 * with a call to a hosted embeddings API and switch the `vector` column
 * to a real `vector` type (pgvector) without touching call sites.
 */

const VECTOR_DIM = 256;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be",
  "been", "to", "of", "in", "on", "for", "with", "as", "at", "by", "it",
  "this", "that", "these", "those", "i", "you", "we", "they", "he", "she",
  "my", "our", "your", "their", "not", "no", "so", "do", "does", "did",
  "have", "has", "had", "can", "could", "would", "should", "will", "just",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

// Simple deterministic string hash -> bucket index.
function hashToken(token: string): number {
  let hash = 0;
  for (let i = 0; i < token.length; i++) {
    hash = (hash * 31 + token.charCodeAt(i)) >>> 0;
  }
  return hash % VECTOR_DIM;
}

export function embedText(text: string): number[] {
  const vector = new Array(VECTOR_DIM).fill(0);
  const tokens = tokenize(text);
  if (tokens.length === 0) return vector;

  for (const token of tokens) {
    vector[hashToken(token)] += 1;
  }

  // L2-normalize so cosine similarity reduces to a dot product.
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

export function serializeVector(vector: number[]): string {
  return JSON.stringify(vector);
}

export function deserializeVector(raw: string): number[] {
  return JSON.parse(raw) as number[];
}

/**
 * Rank a candidate set of {id, vector} against a query vector and return
 * the top-K ids with their similarity scores.
 */
export function topKBySimilarity<T extends { vector: number[] }>(
  queryVector: number[],
  candidates: T[],
  k: number
): Array<T & { score: number }> {
  return candidates
    .map((c) => ({ ...c, score: cosineSimilarity(queryVector, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
