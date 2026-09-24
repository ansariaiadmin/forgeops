import type { MemoryCategory, ProjectMemory } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────── Types ───────────────────────────────

export interface MemoryMetadata {
  tags: string[]
  pinned: boolean
  relatedAgentIds: string[]
  relatedMcpIds: string[]
}

export interface MemoryChange {
  id: string
  author: string
  action: 'created' | 'updated' | 'pinned' | 'unpinned'
  summary: string
  at: Date
}

export interface MemoryDetail {
  tags: string[]
  pinned: boolean
  relatedAgentIds: string[]
  relatedMcpIds: string[]
  history: MemoryChange[]
}

export interface MemoryListItem {
  memory: ProjectMemory
  meta: MemoryMetadata
}

export interface CreateMemoryInput {
  projectId: string
  category: MemoryCategory
  title: string
  content: string
  metadata?: MemoryMetadata
}

// ─────────────────────────────── API functions — real Prisma ───────────────────────────────

export function parseMetadata(memory: ProjectMemory): MemoryMetadata {
  const meta = (memory.metadata ?? {}) as Partial<MemoryMetadata>
  return {
    tags: meta.tags ?? [],
    pinned: meta.pinned ?? false,
    relatedAgentIds: meta.relatedAgentIds ?? [],
    relatedMcpIds: meta.relatedMcpIds ?? [],
  }
}

export async function getProjectMemories(projectId: string): Promise<MemoryListItem[]> {
  const memories = await prisma.projectMemory.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })

  return memories
    .map((memory) => ({ memory, meta: parseMetadata(memory) }))
    .sort((a, b) => {
      if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1
      return b.memory.updatedAt.getTime() - a.memory.updatedAt.getTime()
    })
}

export const getMemories = getProjectMemories

export async function getMemoryById(id: string): Promise<ProjectMemory | null> {
  return prisma.projectMemory.findUnique({ where: { id } })
}

export async function createMemory(input: CreateMemoryInput): Promise<ProjectMemory> {
  if (!input.title || input.title.trim().length < 2) {
    throw new Error('Title must be at least 2 characters')
  }
  if (!input.content || input.content.trim().length < 3) {
    throw new Error('Content must be at least 3 characters')
  }
  if (!input.projectId) throw new Error('projectId required')

  const metadata: MemoryMetadata = input.metadata ?? {
    tags: [],
    pinned: false,
    relatedAgentIds: [],
    relatedMcpIds: [],
  }

  return prisma.projectMemory.create({
    data: {
      projectId: input.projectId,
      category: input.category,
      title: input.title.trim(),
      content: input.content,
      metadata: metadata as unknown as Prisma.InputJsonValue,
    },
  })
}

export async function updateMemory(
  id: string,
  data: Partial<Omit<CreateMemoryInput, 'projectId'>>,
): Promise<ProjectMemory> {
  const existing = await prisma.projectMemory.findUnique({ where: { id } })
  if (!existing) throw new Error('Memory not found')

  return prisma.projectMemory.update({
    where: { id },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.content !== undefined ? { content: data.content } : {}),
      ...(data.metadata !== undefined
        ? { metadata: data.metadata as unknown as Prisma.InputJsonValue }
        : {}),
      updatedAt: new Date(),
    },
  })
}

export async function deleteMemory(id: string): Promise<void> {
  const existing = await prisma.projectMemory.findUnique({ where: { id } })
  if (!existing) throw new Error('Memory not found')
  await prisma.projectMemory.delete({ where: { id } })
}

export async function togglePinMemory(id: string, pinned: boolean): Promise<ProjectMemory> {
  const existing = await prisma.projectMemory.findUnique({ where: { id } })
  if (!existing) throw new Error('Memory not found')

  const meta = parseMetadata(existing)
  return prisma.projectMemory.update({
    where: { id },
    data: {
      metadata: { ...meta, pinned } as unknown as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  })
}

// ─────────────────────────────── Sync compatibility for UI ───────────────────────────────

export function buildHistory(memory: ProjectMemory, meta: MemoryMetadata): MemoryChange[] {
  const history: MemoryChange[] = [
    {
      id: `${memory.id}-h1`,
      author: 'System',
      action: 'created',
      summary: `Created under ${memory.category}`,
      at: memory.createdAt,
    },
  ]
  if (memory.updatedAt.getTime() !== memory.createdAt.getTime()) {
    history.push({
      id: `${memory.id}-h2`,
      author: 'System',
      action: 'updated',
      summary: 'Content edited',
      at: memory.updatedAt,
    })
  }
  if (meta.pinned) {
    history.push({
      id: `${memory.id}-h3`,
      author: 'System',
      action: 'pinned',
      summary: 'Pinned to the top of the list',
      at: new Date(memory.updatedAt.getTime() + 60_000),
    })
  }
  return history.sort((a, b) => b.at.getTime() - a.at.getTime())
}

// Sync versions for UI — return empty arrays for now, real data via fetch API
export function getRelatedAgents(_ids: string[]): Array<{ id: string; name: string }> {
  return []
}

export function getRelatedMcps(_ids: string[]): Array<{ id: string; name: string }> {
  return []
}

export function getAvailableMcps(): Array<{ id: string; name: string }> {
  return []
}

// Async real versions
export async function getRelatedAgentsAsync(ids: string[]) {
  if (ids.length === 0) return []
  return prisma.agent.findMany({ where: { id: { in: ids } } })
}

export async function getRelatedMcpsAsync(ids: string[]) {
  if (ids.length === 0) return []
  return prisma.mCPConnection.findMany({ where: { id: { in: ids } } })
}

export async function getAvailableMcpsAsync(projectId?: string) {
  if (projectId) {
    return prisma.mCPConnection.findMany({ where: { projectId } })
  }
  return prisma.mCPConnection.findMany()
}

export function collectTags(items: MemoryListItem[]): string[] {
  const tags = new Set<string>()
  for (const item of items) item.meta.tags.forEach((tag) => tags.add(tag))
  return [...tags].sort()
}
