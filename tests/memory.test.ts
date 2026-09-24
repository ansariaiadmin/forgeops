import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { getProjectMemories, createMemory, deleteMemory, togglePinMemory } from '@/lib/api/memory'

let testProjectId: string
let createdMemoryId: string

describe('Memory API — real Prisma integration', () => {
  beforeAll(async () => {
    const project = await prisma.project.findFirst()
    if (!project) throw new Error('Seed required')
    testProjectId = project.id
  })

  afterAll(async () => {
    if (createdMemoryId) {
      await prisma.projectMemory.delete({ where: { id: createdMemoryId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('findMany — returns memories with metadata (pinned first)', async () => {
    const memories = await getProjectMemories(testProjectId)
    expect(Array.isArray(memories)).toBe(true)
    expect(memories.length).toBeGreaterThan(0)
    // Check structure
    const first = memories[0]
    expect(first).toHaveProperty('memory')
    expect(first).toHaveProperty('meta')
    expect(first.meta).toHaveProperty('tags')
    expect(first.meta).toHaveProperty('pinned')
  })

  it('create + delete — with pin toggle', async () => {
    const memory = await createMemory({
      projectId: testProjectId,
      category: 'TODO',
      title: `Test Memory ${Date.now()}`,
      content: 'This is a test memory for vitest — should be created and deleted.',
      metadata: {
        tags: ['test', 'vitest'],
        pinned: false,
        relatedAgentIds: [],
        relatedMcpIds: [],
      },
    })

    createdMemoryId = memory.id
    expect(memory.title).toContain('Test Memory')
    expect(memory.category).toBe('TODO')

    // Pin
    const pinned = await togglePinMemory(createdMemoryId, true)
    const meta = pinned.metadata as any
    expect(meta.pinned).toBe(true)

    // Unpin
    const unpinned = await togglePinMemory(createdMemoryId, false)
    expect((unpinned.metadata as any).pinned).toBe(false)

    // Delete
    await deleteMemory(createdMemoryId)
    const after = await prisma.projectMemory.findUnique({ where: { id: createdMemoryId } })
    expect(after).toBeNull()
    createdMemoryId = ''

    // Validation: short title should fail
    await expect(
      createMemory({
        projectId: testProjectId,
        category: 'BUG',
        title: 'A',
        content: 'Valid content',
      }),
    ).rejects.toThrow()
  })
})
