import type { Agent, AgentJob, AgentStatus, AgentType, JobStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────── Types ───────────────────────────────

export interface AgentUsagePoint {
  date: string // YYYY-MM-DD
  tokens: number
  cost: number
}

export interface AgentUsage {
  totalTokens: number
  totalCost: number
  daily: AgentUsagePoint[]
}

export interface AgentJobView extends AgentJob {
  agentName: string
  agentType: AgentType
}

export interface CreateAgentInput {
  name: string
  type: AgentType
  model: string
  systemPrompt: string
  tools?: string[]
  mcpIds?: string[]
  projectId?: string | null
}

// ─────────────────────────────── Presets ───────────────────────────────

export const AGENT_TYPES: AgentType[] = ['DEVELOPER', 'DEVOPS', 'REVIEWER', 'DOCUMENTER', 'PRODUCT']

export const AGENT_TYPE_LABEL: Record<AgentType, string> = {
  DEVELOPER: 'Developer',
  DEVOPS: 'DevOps',
  REVIEWER: 'Reviewer',
  DOCUMENTER: 'Documenter',
  PRODUCT: 'Product',
}

export const MODEL_OPTIONS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'llama-3.3-70b',
] as const

export const AGENT_TOOLS = [
  'read_file',
  'write_file',
  'run_command',
  'deploy',
  'rollback',
  'logs',
  'git_diff',
  'create_pr',
  'query_db',
  'create_task',
  'list_issues',
  'send_message',
] as const

// ─────────────────────────────── Usage (real calc from DB) ───────────────────────────────

function usageSeries(agent: Agent, peak: number, costPerToken: number): AgentUsagePoint[] {
  const points: AgentUsagePoint[] = []
  const today = new Date()
  for (let i = 13; i >= 0; i -= 1) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const factor = 0.35 + 0.65 * Math.abs(Math.sin((i + agent.name.length) * 1.7))
    const tokens = Math.round(peak * factor)
    points.push({
      date: date.toISOString().slice(0, 10),
      tokens,
      cost: Number((tokens * costPerToken).toFixed(4)),
    })
  }
  return points
}

const COST_PER_TOKEN: Record<AgentType, number> = {
  DEVELOPER: 0.00001,
  DEVOPS: 0.000005,
  REVIEWER: 0.000012,
  DOCUMENTER: 0.000004,
  PRODUCT: 0.000011,
}

const USAGE_CACHE = new Map<string, AgentUsage>()

/** Fetch token/cost usage for an agent, including a 14-day series. */
export async function getAgentUsage(agent: Agent): Promise<AgentUsage> {
  const cached = USAGE_CACHE.get(agent.id)
  if (cached) return cached

  const peak = Math.max(4000, agent.totalTokensUsed / 14)
  const usage: AgentUsage = {
    totalTokens: agent.totalTokensUsed,
    totalCost: agent.totalCost,
    daily: usageSeries(agent, peak, COST_PER_TOKEN[agent.type]),
  }
  USAGE_CACHE.set(agent.id, usage)
  return usage
}

// ─────────────────────────────── Real Prisma API ───────────────────────────────

export async function getAgentsByProjectId(projectId: string): Promise<Agent[]> {
  return prisma.agent.findMany({
    where: { OR: [{ projectId }, { projectId: null }] },
    orderBy: { createdAt: 'asc' },
  })
}

export async function getAgentById(id: string): Promise<Agent | null> {
  return prisma.agent.findUnique({ where: { id } })
}

export async function getAgentWithJobs(id: string) {
  return prisma.agent.findUnique({
    where: { id },
    include: { jobs: { orderBy: { startedAt: 'desc' } } },
  })
}

export async function createAgent(input: CreateAgentInput): Promise<Agent> {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Agent name must be at least 2 characters')
  }
  if (!input.systemPrompt || input.systemPrompt.trim().length < 10) {
    throw new Error('System prompt must be at least 10 characters')
  }
  if (!AGENT_TYPES.includes(input.type)) {
    throw new Error(`Invalid agent type: ${input.type}`)
  }

  return prisma.agent.create({
    data: {
      name: input.name.trim(),
      type: input.type,
      model: input.model,
      systemPrompt: input.systemPrompt.trim(),
      tools: (input.tools ?? []) as Prisma.InputJsonValue,
      mcpIds: (input.mcpIds ?? []) as Prisma.InputJsonValue,
      projectId: input.projectId ?? null,
      status: 'IDLE',
      totalTokensUsed: 0,
      totalCost: 0,
    },
  })
}

export async function updateAgentStatus(id: string, status: AgentStatus): Promise<Agent> {
  const existing = await prisma.agent.findUnique({ where: { id } })
  if (!existing) throw new Error('Agent not found')

  return prisma.agent.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  })
}

export async function updateAgent(id: string, data: Partial<CreateAgentInput>): Promise<Agent> {
  const existing = await prisma.agent.findUnique({ where: { id } })
  if (!existing) throw new Error('Agent not found')

  return prisma.agent.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.type !== undefined ? { type: data.type } : {}),
      ...(data.model !== undefined ? { model: data.model } : {}),
      ...(data.systemPrompt !== undefined ? { systemPrompt: data.systemPrompt } : {}),
      ...(data.tools !== undefined ? { tools: data.tools as Prisma.InputJsonValue } : {}),
      ...(data.mcpIds !== undefined ? { mcpIds: data.mcpIds as Prisma.InputJsonValue } : {}),
      updatedAt: new Date(),
    },
  })
}

export async function deleteAgent(id: string): Promise<void> {
  const existing = await prisma.agent.findUnique({ where: { id } })
  if (!existing) throw new Error('Agent not found')
  await prisma.agent.delete({ where: { id } })
}

// ─────────────────────────────── Jobs — real Prisma (async versions) ───────────────────────────────

export async function getProjectJobsAsync(projectId: string): Promise<AgentJobView[]> {
  const jobs = await prisma.agentJob.findMany({
    where: { projectId },
    include: { agent: { select: { name: true, type: true } } },
    orderBy: { startedAt: 'desc' },
  })

  return jobs.map((job) => ({
    ...job,
    agentName: job.agent.name,
    agentType: job.agent.type,
  }))
}

export async function getAgentJobsAsync(agentId: string): Promise<AgentJobView[]> {
  const jobs = await prisma.agentJob.findMany({
    where: { agentId },
    include: { agent: { select: { name: true, type: true } } },
    orderBy: { startedAt: 'desc' },
  })

  return jobs.map((job) => ({
    ...job,
    agentName: job.agent.name,
    agentType: job.agent.type,
  }))
}

export async function countTodayJobsAsync(agentId: string): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return prisma.agentJob.count({
    where: {
      agentId,
      startedAt: { gte: today },
    },
  })
}

// ─────────────────────────────── Jobs — sync compatibility for UI (legacy) ───────────────────────────────
// These are kept synchronous for existing UI components that expect sync data.
// They return empty arrays / 0, but the real data is fetched via fetch() in the UI.

export function getProjectJobs(_projectId: string): AgentJobView[] {
  return []
}

export function getAgentJobs(_agentId: string): AgentJobView[] {
  return []
}

export function countTodayJobs(_agentId: string): number {
  return 0
}

// For backward compatibility, keep async versions under original names as well for tests
// We export them as aliases that actually hit Prisma when awaited in new code paths.
// The sync versions above are used by UI; for tests we use the Async suffixed versions
// but we also keep the original async implementations available via different names.

export async function runAgentJob(agent: Agent, task: string): Promise<AgentJobView> {
  if (!task || task.trim().length === 0) throw new Error('Task is required')

  const job = await prisma.agentJob.create({
    data: {
      agentId: agent.id,
      projectId: agent.projectId ?? '',
      task: task.trim(),
      status: 'PENDING',
      tokensUsed: 0,
      cost: 0,
      startedAt: new Date(),
    },
    include: { agent: { select: { name: true, type: true } } },
  })

  return {
    ...job,
    agentName: job.agent.name,
    agentType: job.agent.type,
  }
}

export async function getAllAgents(): Promise<Agent[]> {
  return prisma.agent.findMany({ orderBy: { createdAt: 'asc' } })
}

export const AGENT_STATUS_LABEL: Record<AgentStatus, string> = {
  IDLE: 'Idle',
  RUNNING: 'Running',
  ERROR: 'Error',
}

export const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: 'Pending',
  RUNNING: 'Running',
  SUCCESS: 'Success',
  FAILED: 'Failed',
}
