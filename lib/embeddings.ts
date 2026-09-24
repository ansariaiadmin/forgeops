/**
 * Embedding layer — real OpenAI embeddings when OPENAI_API_KEY is set,
 * otherwise a deterministic 64-dim pseudo-embedding (hash-based) so the
 * vector pipeline is fully exercised offline. Vectors are plain number
 * arrays stored in RAGSource.embeddings (pgvector-ready in production).
 */

export const EMBEDDING_DIM = 256

/** Deterministic pseudo-embedding for offline mode (character n-grams). */
export function pseudoEmbedding(text: string): number[] {
  const vector = new Array<number>(EMBEDDING_DIM).fill(0)
  const normalized = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ')

  const bump = (feature: string, weight = 1) => {
    let hash = 2166136261
    for (let i = 0; i < feature.length; i += 1) {
      hash ^= feature.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    const slot = Math.abs(hash) % EMBEDDING_DIM
    vector[slot] += weight
  }

  // Word-level features (exact + 4-char prefix so "deploy" ≈ "deployments").
  for (const word of normalized.split(' ')) {
    if (!word) continue
    bump(word, 2)
    bump(word.slice(0, 4), 1.5)
    // Character bigrams capture shared roots.
    for (let i = 0; i < word.length - 1; i += 1) {
      bump(word.slice(i, i + 2), 0.5)
    }
  }

  // Normalize (unit vector) so cosine similarity is meaningful.
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1
  return vector.map((value) => value / norm)
}

/** Embed a batch of texts (real API when key present, pseudo otherwise). */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (process.env.OPENAI_API_KEY) {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
    })
    if (response.ok) {
      const data = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>
      }
      const embeddings = data.data?.map((item) => item.embedding ?? []) ?? []
      if (embeddings.length === texts.length) return embeddings
    }
  }
  return texts.map(pseudoEmbedding)
}

/** Cosine similarity between two vectors (0..1). */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB)
  return denom === 0 ? 0 : dot / denom
}
