import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getAgentsByProjectId,
  getAgentById,
  createAgent,
  updateAgentStatus,
  deleteAgent,
  getProjectJobsAsync,
  countTodayJobsAsync,
} from '@/lib/api/agents'

let testProjectId: string
let createdAgentId: string

describe('Agents API — real Prisma integration', () => {
  beforeAll(async () => {
    const project = await prisma.project.findFirst()
    if (!project) throw new Error('Seed required')
    testProjectId = project.id
  })

  afterAll(async () => {
    if (createdAgentId) {
      await prisma.agent.delete({ where: { id: createdAgentId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('findMany where projectId — returns agents (including global)', async () => {
    const agents = await getAgentsByProjectId(testProjectId)
    expect(Array.isArray(agents)).toBe(true)
    expect(agents.length).toBeGreaterThan(0)
    // All should be either this project or global (null)
    for (const a of agents) {
      expect(a.projectId === testProjectId || a.projectId === null).toBe(true)
    }
  })

  it('findUnique — get agent by ID with relations', async () => {
    const agents = await prisma.agent.findMany({ take: 1 })
    const agent = await getAgentById(agents[0].id)
    expect(agent).not.toBeNull()
    expect(agent?.id).toBe(agents[0].id)

    const jobs = await getProjectJobsAsync(agents[0].projectId ?? testProjectId)
    expect(Array.isArray(jobs)).toBe(true)
  })

  it('create — with validation and persistence', async () => {
    const agent = await createAgent({
      name: `TestAgent-${Date.now()}`,
      type: 'DEVELOPER',
      model: 'gpt-4o-mini',
      systemPrompt: 'You are a helpful test agent for vitest integration testing.',
      tools: ['read_file', 'write_file'],
      mcpIds: [],
      projectId: testProjectId,
    })

    createdAgentId = agent.id
    expect(agent.name).toContain('TestAgent')
    expect(agent.status).toBe('IDLE')
    expect(agent.projectId).toBe(testProjectId)

    // Validation: short name should fail
    await expect(
      createAgent({
        name: 'A',
        type: 'DEVELOPER',
        model: 'gpt-4o',
        systemPrompt: 'You are a test agent with long enough prompt.',
        projectId: testProjectId,
      }),
    ).rejects.toThrow()

    // Validation: short system prompt
    await expect(
      createAgent({
        name: 'Valid Name',
        type: 'DEVELOPER',
        model: 'gpt-4o',
        systemPrompt: 'Short',
        projectId: testProjectId,
      }),
    ).rejects.toThrow()
  })

  it('updateStatus — IDLE -> RUNNING -> IDLE', async () => {
    const running = await updateAgentStatus(createdAgentId, 'RUNNING')
    expect(running.status).toBe('RUNNING')

    const idle = await updateAgentStatus(createdAgentId, 'IDLE')
    expect(idle.status).toBe('IDLE')

    const todayCount = await countTodayJobsAsync(createdAgentId)
    expect(typeof todayCount).toBe('number')

    // Cleanup
    await deleteAgent(createdAgentId)
    createdAgentId = ''

    const after = await prisma.agent.findUnique({ where: { id: running.id } })
    expect(after).toBeNull()
  })
})
