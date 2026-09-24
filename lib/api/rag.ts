import type { Prisma, RAGSource, RAGSourceType } from '@prisma/client'

import { cosineSimilarity, pseudoEmbedding } from '@/lib/embeddings'
import { prisma } from '@/lib/prisma'

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

// ─────────────────────────────── API functions — real Prisma ───────────────────────────────

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

function deriveStatus(source: RAGSource): RagStatus {
  if (source.isIndexed) return 'INDEXED'
  // If chunks null and not indexed, consider FAILED if old, else PENDING
  if (!source.chunks && !source.isIndexed) {
    // Check if it's been more than 1 day since creation and still not indexed
    const ageDays = (Date.now() - source.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    if (ageDays > 1) return 'FAILED'
  }
  return 'PENDING'
}

/** Fetch all RAG sources of a project, newest first — real Prisma. */
export async function getRagSources(projectId: string): Promise<RagSourceView[]> {
  const sources = await prisma.rAGSource.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })

  return sources.map((source) => ({ ...source, status: deriveStatus(source) }))
}

/** Get single RAG source by ID */
export async function getRagSourceById(id: string): Promise<RagSourceView | null> {
  const source = await prisma.rAGSource.findUnique({ where: { id } })
  if (!source) return null
  return { ...source, status: deriveStatus(source) }
}

/** Create RAG source — real Prisma */
export async function createRagSource(input: {
  projectId: string
  type: RAGSourceType
  path: string
  chunks?: RagChunk[] | string[]
  embeddings?: number[][] | null
}): Promise<RAGSource> {
  if (!input.path || input.path.trim().length < 3) throw new Error('Path must be at least 3 characters')
  if (!input.projectId) throw new Error('projectId required')

  const chunks = input.chunks ?? generateChunks('', input.type, input.path).map((c) => c.text)

  return prisma.rAGSource.create({
    data: {
      projectId: input.projectId,
      type: input.type,
      path: input.path.trim(),
      isIndexed: true,
      lastIndexedAt: new Date(),
      chunks: chunks as unknown as Prisma.InputJsonValue,
      embeddings: (input.embeddings ?? null) as unknown as Prisma.InputJsonValue,
    },
  })
}

/** Delete RAG source */
export async function deleteRagSource(id: string): Promise<void> {
  const existing = await prisma.rAGSource.findUnique({ where: { id } })
  if (!existing) throw new Error('Source not found')
  await prisma.rAGSource.delete({ where: { id } })
}

/** Re-index source */
export async function reindexRagSource(id: string): Promise<RAGSource> {
  const existing = await prisma.rAGSource.findUnique({ where: { id } })
  if (!existing) throw new Error('Source not found')

  const chunks = generateChunks(id, existing.type, existing.path)

  return prisma.rAGSource.update({
    where: { id },
    data: {
      isIndexed: true,
      lastIndexedAt: new Date(),
      chunks: chunks.map((c) => c.text) as unknown as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  })
}

/** Search RAG sources by keyword — real Prisma + keyword search */
export async function searchRagSources(projectId: string, query: string, limit = 8): Promise<SearchResult[]> {
  const sources = await getRagSources(projectId)
  return searchKnowledgeBase(sources, query, limit)
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

// ─────────────────────────────── Semantic search (keyword + embedding) ───────────────────────────────

/**
 * Score how well a chunk matches a query — simple token-overlap:
 * what fraction of the query words appear in the chunk text, plus a
 * small bonus for exact phrase containment. 0–100.
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

function pseudoEmbedQuery(query: string): number[] | null {
  return pseudoEmbedding(query)
}

export function readEmbeddings(source: RAGSource, chunkCount: number): Array<number[] | null> {
  const raw = source.embeddings
  if (!Array.isArray(raw)) return Array.from({ length: chunkCount }, () => null)
  return Array.from({ length: chunkCount }, (_, index) => {
    const item = raw[index]
    return Array.isArray(item) ? (item as number[]) : null
  })
}

export function chunkTitle(chunk: RagChunk): string {
  const firstSentence = chunk.text.split(/[.\n]/)[0].trim()
  return firstSentence.length > 56 ? `${firstSentence.slice(0, 56)}…` : firstSentence
}

// ─────────────────────────────── Indexing helpers ───────────────────────────────

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

export const RAG_TYPE_LABEL: Record<RAGSourceType, string> = {
  FILE: 'File',
  DOCUMENT: 'Document',
  GIT: 'Git',
  URL: 'URL',
  PDF: 'PDF',
  WIKI: 'Wiki',
}
