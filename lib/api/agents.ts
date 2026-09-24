import type { Agent, AgentJob, AgentStatus, AgentType, JobStatus } from '@prisma/client'

import { mockAgents, mockJobs } from '@/lib/mock-data'

/**
 * Mock API layer for project agents.
 *
 * Future REST surface (UI stays unchanged):
 *   GET    /api/projects/[slug]/agents
 *   POST   /api/projects/[slug]/agents
 *   PATCH  /api/projects/[slug]/agents/[id]
 *   DELETE /api/projects/[slug]/agents/[id]
 *   POST   /api/projects/[slug]/agents/[id]/run
 *   POST   /api/projects/[slug]/agents/[id]/stop
 *   POST   /api/projects/[slug]/jobs
 *   GET    /api/projects/[slug]/agents/[id]/usage
 */

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

// ─────────────────────────────── Mock usage ───────────────────────────────

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

// ─────────────────────────────── Jobs ───────────────────────────────

/** Jobs of a project, enriched with agent names. */
export function getProjectJobs(projectId: string): AgentJobView[] {
  return mockJobs
    .filter((job) => job.projectId === projectId)
    .map((job) => {
      const agent = mockAgents.find((a) => a.id === job.agentId)
      return {
        ...job,
        agentName: agent?.name ?? 'Unknown',
        agentType: agent?.type ?? 'DEVELOPER',
      }
    })
    .sort((a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0))
}

/** Jobs of a single agent, newest first. */
export function getAgentJobs(agentId: string): AgentJobView[] {
  return getProjectJobs('proj-core')
    .filter((job) => job.agentId === agentId)
    .sort((a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0))
}

/** Today's job count for an agent. */
export function countTodayJobs(agentId: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return mockJobs.filter(
    (job) => job.agentId === agentId && job.startedAt && job.startedAt >= today,
  ).length
}

/** Simulated job run; later: POST /api/projects/[slug]/agents/[id]/run. */
export async function runAgentJob(agent: Agent, task: string): Promise<AgentJobView> {
  const job: AgentJobView = {
    id: `job-${Math.floor(1000 + Math.random() * 9000)}`,
    agentId: agent.id,
    agentName: agent.name,
    agentType: agent.type,
    projectId: agent.projectId ?? 'proj-core',
    task,
    status: 'PENDING',
    result: null,
    error: null,
    tokensUsed: 0,
    cost: 0,
    startedAt: null,
    completedAt: null,
  }
  return job
}

// ─────────────────────────────── Agent helpers ───────────────────────────────

/** Status → readable label. */
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
