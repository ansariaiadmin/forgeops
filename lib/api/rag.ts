import type { Prisma, RAGSource, RAGSourceType } from '@prisma/client'

import { cosineSimilarity, pseudoEmbedding } from '@/lib/embeddings'

/**
 * Mock API layer for the RAG knowledge base.
 *
 * Future REST surface (UI stays unchanged):
 *   GET  /api/projects/[slug]/rag/sources
 *   POST /api/projects/[slug]/rag/sources          (index new source)
 *   POST /api/projects/[slug]/rag/sources/[id]/index (re-index)
 *   GET  /api/projects/[slug]/rag/search?q=...
 *
 * Search is hybrid: text token-overlap (MVP) fused with embedding cosine
 * similarity when vectors are present (lib/embeddings — real OpenAI or
 * deterministic pseudo-vectors). Vectors live in RAGSource.embeddings,
 * ready for pgvector in production.
 */

// ─────────────────────────────── Types ───────────────────────────────

export type RagStatus = 'PENDING' | 'INDEXED' | 'FAILED'

export interface RagSourceView extends RAGSource {
  status: RagStatus
}

export interface RagChunk {
  id: string
  text: string
}

export interface RagStats {
  totalSources: number
  indexedSources: number
  totalChunks: number
  lastIndexedAt: Date | null
}

export interface SearchResult {
  chunk: RagChunk
  score: number // 0–100 similarity
  source: RagSourceView
}

// ─────────────────────────────── Mock data ───────────────────────────────

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)

/** Source ids that failed indexing (kept outside the Prisma shape). */
const FAILED_SOURCE_IDS = new Set(['rag-004'])

const CHUNKS_BY_SOURCE: Record<string, string[]> = {
  'rag-001': [
    'forge-core is the core orchestration engine for the ForgeOps platform, managing deployments, agents and environments.',
    'Multi-environment deployments to dev, staging and production are coordinated through a Redis-backed job queue.',
    'The platform runs three services: web (Next.js UI), api (edge routes) and worker (background jobs).',
    'Health monitoring watches every container and automatically rolls back deployments that fail their health checks.',
    'Authentication uses JWT with a rotating refresh token, signed with the same secret as the NextAuth session cookie.',
  ],
  'rag-002': [
    'POST /api/deploy accepts a project and environment, validates the payload with Zod and enqueues a deploy job.',
    'GET /api/health returns the current service status, uptime and the last deployment result.',
    'API responses use consistent envelopes: data, error and status, returning 202 for accepted async jobs.',
    'Rate limiting is planned: Redis-based token bucket at 100 requests per minute per API key.',
  ],
  'rag-003': [
    'Architecture rule: services never import each other directly — all cross-service work flows through the job queue.',
    'The database is a single shared Postgres 16 instance with one schema per service.',
    'Secrets are stored in environment variables and injected at container start; never committed to the repository.',
    'Observability: every job writes structured logs with a correlation id so a single deploy can be traced end-to-end.',
  ],
}

const MOCK_SOURCES: RAGSource[] = [
  {
    id: 'rag-001',
    projectId: 'proj-core',
    type: 'FILE',
    path: 'README.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(2),
    chunks: CHUNKS_BY_SOURCE['rag-001'],
    embeddings: null,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
  },
  {
    id: 'rag-002',
    projectId: 'proj-core',
    type: 'DOCUMENT',
    path: 'docs/api.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(5),
    chunks: CHUNKS_BY_SOURCE['rag-002'],
    embeddings: null,
    createdAt: daysAgo(80),
    updatedAt: daysAgo(5),
  },
  {
    id: 'rag-003',
    projectId: 'proj-core',
    type: 'DOCUMENT',
    path: 'docs/architecture.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(12),
    chunks: CHUNKS_BY_SOURCE['rag-003'],
    embeddings: null,
    createdAt: daysAgo(70),
    updatedAt: daysAgo(12),
  },
  {
    id: 'rag-004',
    projectId: 'proj-core',
    type: 'PDF',
    path: 'reports/spec-v2.pdf',
    isIndexed: false,
    lastIndexedAt: null,
    chunks: null,
    embeddings: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
  {
    id: 'rag-005',
    projectId: 'proj-core',
    type: 'URL',
    path: 'https://forgeops.dev/guides/deploy',
    isIndexed: false,
    lastIndexedAt: null,
    chunks: null,
    embeddings: null,
    createdAt: hoursAgo(20),
    updatedAt: hoursAgo(20),
  },
]

// ─────────────────────────────── API functions ───────────────────────────────

/** Read the chunk array from a source (supports both {id,text} and plain strings). */
export function readChunks(source: RAGSource): RagChunk[] {
  const chunks = source.chunks
  if (!Array.isArray(chunks)) return []
  return chunks
    .map((chunk, index) => {
      if (typeof chunk === 'string') return { id: `${source.id}-c${index}`, text: chunk }
      if (typeof chunk !== 'object' || chunk === null) return null
      const record = chunk as Record<string, unknown>
      return typeof record.text === 'string'
        ? { id: String(record.id ?? `${source.id}-c${index}`), text: record.text }
        : null
    })
    .filter((chunk): chunk is RagChunk => chunk !== null)
}

/** Cast typed chunks to Prisma JsonArray for storage. */
export function toJsonChunks(chunks: RagChunk[]): Prisma.JsonArray {
  return chunks as unknown as Prisma.JsonArray
}

/** Fetch all RAG sources of a project, newest first. */
export async function getRagSources(projectId: string): Promise<RagSourceView[]> {
  return MOCK_SOURCES.filter((source) => source.projectId === projectId)
    .map((source) => ({ ...source, status: deriveStatus(source) }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

function deriveStatus(source: RAGSource): RagStatus {
  if (source.isIndexed) return 'INDEXED'
  if (FAILED_SOURCE_IDS.has(source.id)) return 'FAILED'
  return 'PENDING'
}

/** Aggregate knowledge base stats. */
export function computeRagStats(sources: RagSourceView[]): RagStats {
  let totalChunks = 0
  let lastIndexedAt: Date | null = null
  for (const source of sources) {
    if (source.isIndexed) {
      totalChunks += readChunks(source).length
      if (!lastIndexedAt || (source.lastIndexedAt && source.lastIndexedAt > lastIndexedAt)) {
        lastIndexedAt = source.lastIndexedAt
      }
    }
  }
  return {
    totalSources: sources.length,
    indexedSources: sources.filter((source) => source.isIndexed).length,
    totalChunks,
    lastIndexedAt,
  }
}

// ─────────────────────────────── Semantic search (MVP: text) ───────────────────────────────

/**
 * Score how well a chunk matches a query — simple token-overlap:
 * what fraction of the query words appear in the chunk text, plus a
 * small bonus for exact phrase containment. 0–100.
 * Later this becomes a real embedding similarity search.
 */
export function scoreChunk(query: string, chunkText: string): number {
  const normalized = query.toLowerCase().trim()
  if (!normalized) return 0
  const words = normalized.split(/\s+/).filter(Boolean)
  if (words.length === 0) return 0

  const text = chunkText.toLowerCase()
  let hits = 0
  for (const word of words) {
    if (text.includes(word)) hits += 1
  }
  if (hits === 0) return 0

  const coverage = (hits / words.length) * 100
  const phraseBonus = text.includes(normalized) ? 15 : 0
  return Math.min(100, Math.round(coverage + phraseBonus))
}

/**
 * Search indexed chunks with a hybrid scorer:
 *   0.6 × embedding cosine similarity (when vectors exist)
 *   0.4 × text token-overlap
 * Falls back to pure text scoring when a source has no embeddings.
 */
export function searchKnowledgeBase(
  sources: RagSourceView[],
  query: string,
  limit = 8,
): SearchResult[] {
  const results: SearchResult[] = []
  const queryVector = pseudoEmbedQuery(query)

  for (const source of sources) {
    if (!source.isIndexed) continue
    const chunks = readChunks(source)
    const vectors = readEmbeddings(source, chunks.length)

    chunks.forEach((chunk, index) => {
      const textScore = scoreChunk(query, chunk.text)
      const vector = vectors[index]
      const vectorScore = vector && queryVector ? cosineSimilarity(queryVector, vector) * 100 : null

      // Hybrid: blend when both signals exist, else use whichever is available.
      const score =
        vectorScore !== null && textScore > 0
          ? Math.round(textScore * 0.4 + vectorScore * 0.6)
          : vectorScore !== null
            ? Math.round(vectorScore)
            : textScore

      if (score > 0) results.push({ chunk, score, source })
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** Pseudo-embedding of the query (hybrid scoring uses it when vectors exist). */
function pseudoEmbedQuery(query: string): number[] | null {
  return pseudoEmbedding(query)
}

/** Read the embeddings array stored on a source (validated length). */
export function readEmbeddings(source: RAGSource, chunkCount: number): Array<number[] | null> {
  const raw = source.embeddings
  if (!Array.isArray(raw)) return Array.from({ length: chunkCount }, () => null)
  return Array.from({ length: chunkCount }, (_, index) => {
    const item = raw[index]
    return Array.isArray(item) ? (item as number[]) : null
  })
}

/** Title for a result: the first sentence of the chunk, trimmed. */
export function chunkTitle(chunk: RagChunk): string {
  const firstSentence = chunk.text.split(/[.\n]/)[0].trim()
  return firstSentence.length > 56 ? `${firstSentence.slice(0, 56)}…` : firstSentence
}

// ─────────────────────────────── Indexing helpers ───────────────────────────────

/** Generate mock chunks for a freshly indexed source. */
export function generateChunks(sourceId: string, type: RAGSourceType, path: string): RagChunk[] {
  const name = path.split('/').pop() ?? path
  const topics: Record<string, string> = {
    FILE: `The file ${path} documents the project's build and runtime configuration, including scripts, dependencies and entry points.`,
    DOCUMENT: `The document ${path} describes the project's architecture, API contracts and operational runbooks for ${name}.`,
    URL: `The page at ${path} covers deployment guides, environment setup and troubleshooting for the ForgeOps platform.`,
  }
  const base = topics[type] ?? `Source ${path} contributes context about the project.`
  return Array.from({ length: 5 }, (_, index) => ({
    id: `${sourceId}-c${index}`,
    text: `${base} Chunk ${index + 1} of 5 — ${['Overview', 'Setup', 'Usage', 'Troubleshooting', 'References'][index]}.`,
  }))
}

/** Source type label shown in badges. */
export const RAG_TYPE_LABEL: Record<RAGSourceType, string> = {
  FILE: 'File',
  DOCUMENT: 'Document',
  GIT: 'Git',
  URL: 'URL',
  PDF: 'PDF',
  WIKI: 'Wiki',
}
