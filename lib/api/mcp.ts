import type { MCPConnection } from '@prisma/client'

import { mockMcpConnections } from '@/lib/mock-data'

/**
 * Mock API layer for the MCP Hub.
 *
 * Future REST surface (UI stays unchanged):
 *   GET    /api/projects/[slug]/mcp
 *   POST   /api/projects/[slug]/mcp
 *   PATCH  /api/projects/[slug]/mcp/[id]
 *   DELETE /api/projects/[slug]/mcp/[id]
 *   POST   /api/projects/[slug]/mcp/[id]/connect
 *   POST   /api/projects/[slug]/mcp/[id]/disconnect
 *   POST   /api/projects/[slug]/mcp/[id]/restart
 *   POST   /api/projects/[slug]/mcp/[id]/test
 *   GET    /api/projects/[slug]/mcp/[id]/logs
 *   GET    /api/projects/[slug]/mcp/[id]/usage
 */

// ─────────────────────────────── Types ───────────────────────────────

export interface McpLogEntry {
  id: string
  at: Date
  tool: string
  status: 'ok' | 'error'
  durationMs: number
  detail: string
}

export interface McpUsage {
  requestsToday: number
  tokensToday: number
  errorsToday: number
  avgLatencyMs: number
}

export interface McpTestResult {
  ok: boolean
  latencyMs: number
  message: string
}

// ─────────────────────────────── Presets ───────────────────────────────

export const MCP_TYPE_OPTIONS = [
  'github',
  'slack',
  'jira',
  'postgres',
  'redis',
  'filesystem',
  'kubernetes',
  'custom',
] as const

export type McpType = (typeof MCP_TYPE_OPTIONS)[number]

export const MCP_TYPE_LABEL: Record<McpType, string> = {
  github: 'GitHub',
  slack: 'Slack',
  jira: 'Jira',
  postgres: 'Postgres',
  redis: 'Redis',
  filesystem: 'Filesystem',
  kubernetes: 'Kubernetes',
  custom: 'Custom',
}

export const MCP_TYPE_HINT: Record<McpType, string> = {
  github: 'Repos, PRs, issues and CI actions',
  slack: 'Channels, messages and notifications',
  jira: 'Issues, sprints and projects',
  postgres: 'Read/write access to a Postgres database',
  redis: 'Key-value store access',
  filesystem: 'File read/write inside the workspace',
  kubernetes: 'Pods, deployments and scaling',
  custom: 'Any MCP server implementing the protocol',
}

/** Allowed-tool presets offered per connection type. */
export const TOOLS_BY_TYPE: Record<McpType, string[]> = {
  github: ['read_file', 'create_pr', 'list_issues', 'merge_pr', 'run_action'],
  slack: ['post_message', 'list_channels', 'read_messages', 'react'],
  jira: ['create_issue', 'search_issues', 'update_status', 'list_sprints'],
  postgres: ['query', 'execute', 'list_tables', 'describe'],
  redis: ['get', 'set', 'del', 'keys', 'publish'],
  filesystem: ['read_file', 'write_file', 'list_dir', 'delete_file'],
  kubernetes: ['get_pods', 'scale', 'get_logs', 'describe'],
  custom: [],
}

// ─────────────────────────────── Mock data ───────────────────────────────

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)

const LOGS_BY_ID: Record<string, McpLogEntry[]> = {
  'mcp-github': [
    {
      id: 'l1',
      at: minutesAgo(4),
      tool: 'create_pr',
      status: 'ok',
      durationMs: 842,
      detail: 'PR #483 opened — feat: optimistic UI',
    },
    {
      id: 'l2',
      at: minutesAgo(26),
      tool: 'list_issues',
      status: 'ok',
      durationMs: 210,
      detail: '12 open issues fetched',
    },
    {
      id: 'l3',
      at: minutesAgo(61),
      tool: 'run_action',
      status: 'error',
      durationMs: 92_400,
      detail: 'workflow failed: e2e — checkout flake',
    },
    {
      id: 'l4',
      at: hoursAgoText(2),
      tool: 'merge_pr',
      status: 'ok',
      durationMs: 1_124,
      detail: 'PR #479 merged',
    },
    {
      id: 'l5',
      at: hoursAgoText(4),
      tool: 'read_file',
      status: 'ok',
      durationMs: 98,
      detail: 'src/lib/auth.ts (2.1 KB)',
    },
  ],
  'mcp-k8s': [
    {
      id: 'l1',
      at: minutesAgo(9),
      tool: 'get_pods',
      status: 'ok',
      durationMs: 411,
      detail: '34 pods in namespace forge-prod',
    },
    {
      id: 'l2',
      at: minutesAgo(40),
      tool: 'scale',
      status: 'ok',
      durationMs: 3_120,
      detail: 'deploy api-gateway scaled 2 → 4',
    },
    {
      id: 'l3',
      at: hoursAgoText(3),
      tool: 'get_logs',
      status: 'error',
      durationMs: 18_000,
      detail: 'timed out reading logs from crashlooping pod',
    },
  ],
  'mcp-postgres': [
    {
      id: 'l1',
      at: minutesAgo(2),
      tool: 'query',
      status: 'ok',
      durationMs: 14,
      detail: 'SELECT count(*) FROM jobs → 12_481',
    },
    {
      id: 'l2',
      at: minutesAgo(55),
      tool: 'query',
      status: 'ok',
      durationMs: 22,
      detail: 'EXPLAIN on tasks index scan',
    },
    {
      id: 'l3',
      at: hoursAgoText(5),
      tool: 'execute',
      status: 'error',
      durationMs: 320,
      detail: 'deadlock detected on jobs (retryable)',
    },
  ],
  'mcp-fs': [
    {
      id: 'l1',
      at: minutesAgo(12),
      tool: 'list_dir',
      status: 'ok',
      durationMs: 6,
      detail: 'src/ → 14 entries',
    },
    {
      id: 'l2',
      at: minutesAgo(48),
      tool: 'read_file',
      status: 'ok',
      durationMs: 9,
      detail: 'package.json',
    },
    {
      id: 'l3',
      at: hoursAgoText(2),
      tool: 'write_file',
      status: 'ok',
      durationMs: 11,
      detail: 'docs/api.md (append)',
    },
  ],
}

function hoursAgoText(h: number) {
  return new Date(Date.now() - h * 3_600_000)
}

const USAGE_BY_ID: Record<string, McpUsage> = {
  'mcp-github': { requestsToday: 148, tokensToday: 42_300, errorsToday: 3, avgLatencyMs: 620 },
  'mcp-k8s': { requestsToday: 96, tokensToday: 18_200, errorsToday: 1, avgLatencyMs: 1_940 },
  'mcp-postgres': { requestsToday: 421, tokensToday: 8_400, errorsToday: 2, avgLatencyMs: 18 },
  'mcp-redis': { requestsToday: 12, tokensToday: 900, errorsToday: 0, avgLatencyMs: 4 },
  'mcp-fs': { requestsToday: 203, tokensToday: 11_700, errorsToday: 0, avgLatencyMs: 9 },
  'mcp-slack': { requestsToday: 31, tokensToday: 6_200, errorsToday: 4, avgLatencyMs: 380 },
}

// ─────────────────────────────── API functions ───────────────────────────────

/** Fetch the MCP connections of a project. */
export async function getMcpConnections(projectId: string): Promise<MCPConnection[]> {
  return mockMcpConnections.filter((mcp) => mcp.projectId === projectId)
}

/** Usage statistics for a connection. */
export async function getMcpUsage(mcpId: string): Promise<McpUsage> {
  return USAGE_BY_ID[mcpId] ?? { requestsToday: 0, tokensToday: 0, errorsToday: 0, avgLatencyMs: 0 }
}

/** Request/error log for a connection. */
export async function getMcpLogs(mcpId: string): Promise<McpLogEntry[]> {
  return LOGS_BY_ID[mcpId] ?? []
}

/** Simulated connectivity test; later: POST .../mcp/[id]/test. */
export async function testMcpConnection(mcp: MCPConnection): Promise<McpTestResult> {
  const latencyMs = 40 + Math.floor(Math.random() * 240)
  const ok = mcp.status !== 'ERROR' || Math.random() > 0.35
  return {
    ok,
    latencyMs,
    message: ok
      ? `Handshake completed in ${latencyMs}ms — ${mcp.type} server responded.`
      : `Handshake failed after ${latencyMs}ms — check the config and network access.`,
  }
}

/** Count how many tools a connection allows. */
export function countAllowedTools(mcp: MCPConnection): number {
  if (!Array.isArray(mcp.allowedTools)) return 0
  return mcp.allowedTools.length
}

/** All tool names available for a type (preset ∪ existing). */
export function availableToolsFor(type: string, current: string[] = []): string[] {
  const preset = TOOLS_BY_TYPE[type as McpType] ?? []
  return [...new Set([...preset, ...current])]
}
