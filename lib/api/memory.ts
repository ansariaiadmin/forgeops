import type { MCPConnection } from '@prisma/client'

import { mockAgents } from '@/lib/mock-data'

/**
 * Mock API layer for project memory.
 *
 * Future REST surface (UI stays unchanged):
 *   GET    /api/projects/[slug]/memory
 *   POST   /api/projects/[slug]/memory
 *   PATCH  /api/projects/[slug]/memory/[id]
 *   DELETE /api/projects/[slug]/memory/[id]
 *   POST   /api/projects/[slug]/memory/[id]/pin
 */

// ─────────────────────────────── Types ───────────────────────────────

/** Extra data stored in ProjectMemory.metadata (keeps the Prisma model untouched). */
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

// ─────────────────────────────── Mock data ───────────────────────────────

import type { ProjectMemory } from '@prisma/client'

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)

const mockMemories: ProjectMemory[] = [
  {
    id: 'mem-001',
    projectId: 'proj-core',
    category: 'ARCHITECTURE',
    title: 'Service boundaries and data flow',
    content: [
      '# Service boundaries',
      '',
      'forge-core is split into three layers:',
      '',
      '- **web** — Next.js app, renders UI and proxies to the API',
      '- **api** — edge routes, validation with Zod, job enqueueing',
      '- **worker** — background jobs, talks to Docker directly',
      '',
      '> Rule: services never import each other — they communicate through the job queue.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['architecture', 'services'],
      pinned: true,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: ['mcp-github'],
    },
    createdAt: daysAgo(90),
    updatedAt: daysAgo(12),
  },
  {
    id: 'mem-002',
    projectId: 'proj-core',
    category: 'DECISION',
    title: 'ADR-014: Keep REST over GraphQL',
    content: [
      '## Context',
      '',
      'We evaluated GraphQL for the public API (v2).',
      '',
      '## Decision',
      '',
      'Stay with **REST + OpenAPI** — the API surface is small and stable, and tooling',
      'interoperability with non-JS clients matters more than client-side query flexibility.',
      '',
      '## Consequences',
      '',
      '- + Caching is simpler (per-route)',
      '- − Clients over-fetch on list views',
      '',
    ].join('\n'),
    metadata: {
      tags: ['adr', 'api'],
      pinned: false,
      relatedAgentIds: ['agt-review'],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(40),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'mem-003',
    projectId: 'proj-core',
    category: 'DECISION',
    title: 'Single shared Postgres instance',
    content: [
      'All services share one Postgres 16 instance with separate schemas.',
      '',
      '**Reason:** operational simplicity at our scale — a fleet of micro-DBs added',
      'more ops overhead than isolation value.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['database'],
      pinned: false,
      relatedAgentIds: [],
      relatedMcpIds: ['mcp-postgres'],
    },
    createdAt: daysAgo(38),
    updatedAt: daysAgo(38),
  },
  {
    id: 'mem-004',
    projectId: 'proj-core',
    category: 'BUG',
    title: 'Race condition in deploy worker',
    content: [
      '**Status:** investigating — low priority (1/10).',
      '',
      'Two deploys to the same service can race: both read `desired_version` before',
      'either writes. Symptom: occasional double-rollout in the audit log.',
      '',
      '```ts',
      '// current (racy)',
      'const desired = await db.getDesiredVersion(service)',
      'await docker.deploy(service, desired) // ← interleaving here',
      '```',
      '',
      'Fix: serialize with a per-service advisory lock in Postgres.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['bug', 'concurrency'],
      pinned: true,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(20),
    updatedAt: daysAgo(3),
  },
  {
    id: 'mem-005',
    projectId: 'proj-core',
    category: 'CONVENTION',
    title: 'Commit message conventions',
    content: [
      'Use **Conventional Commits**:',
      '',
      '- `feat:` — new capability',
      '- `fix:` — bug fix',
      '- `refactor:` — no behavior change',
      '- `docs:` — documentation only',
      '',
      'Branch names: `feat/`, `fix/`, `chore/` prefix, kebab-case.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['git', 'workflow'],
      pinned: false,
      relatedAgentIds: ['agt-review'],
      relatedMcpIds: ['mcp-github'],
    },
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
  {
    id: 'mem-006',
    projectId: 'proj-core',
    category: 'CONVENTION',
    title: 'Environment variable naming',
    content: [
      '- `*_URL` for connection strings',
      '- `*_SECRET` / `*_TOKEN` for credentials (never log them)',
      '- `PORT` uppercase, no prefix',
      '',
      'New env vars must be added to `.env.example` in the same PR.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['env', 'convention'],
      pinned: false,
      relatedAgentIds: [],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(45),
    updatedAt: daysAgo(45),
  },
  {
    id: 'mem-007',
    projectId: 'proj-core',
    category: 'TODO',
    title: 'Migrate legacy-billing to forge-core',
    content: [
      '- [ ] Export data from legacy-billing (API + CSV)',
      '- [ ] Map customer schema to forge-core',
      '- [ ] Cutover with feature flag `billing-v2`',
      '- [ ] Sunset legacy-billing after 30 days of dual-run',
      '',
    ].join('\n'),
    metadata: {
      tags: ['migration', 'billing'],
      pinned: false,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(15),
    updatedAt: hoursAgo(9),
  },
  {
    id: 'mem-008',
    projectId: 'proj-core',
    category: 'TODO',
    title: 'Add rate limiting to public API',
    content: [
      'Public endpoints currently have **no rate limiting**.',
      '',
      'Plan: Redis-based token bucket in the edge router, 100 req/min per key.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['api', 'security'],
      pinned: false,
      relatedAgentIds: [],
      relatedMcpIds: ['mcp-redis'],
    },
    createdAt: daysAgo(10),
    updatedAt: daysAgo(10),
  },
  {
    id: 'mem-009',
    projectId: 'proj-core',
    category: 'ARCHITECTURE',
    title: 'Auth flow (JWT refresh)',
    content: [
      '```mermaid-ish flow',
      'client → POST /auth/login → { access, refresh }',
      'access: JWT, 15 min, stateless',
      'refresh: 30 days, stored hashed, rotated on use',
      '```',
      '',
      'The NextAuth session cookie uses the same signing secret as the access token.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['auth', 'security'],
      pinned: false,
      relatedAgentIds: [],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(25),
    updatedAt: daysAgo(1),
  },
  {
    id: 'mem-010',
    projectId: 'proj-core',
    category: 'BUG',
    title: 'Memory leak in log streamer',
    content: [
      '**Status:** fixed in 2.13.2 — keep an eye on `heapUsed` after long deploys.',
      '',
      'The streamer kept a reference to every chunk emitted per connection;',
      'backpressure was never applied.',
      '',
    ].join('\n'),
    metadata: {
      tags: ['bug', 'observability'],
      pinned: false,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: [],
    },
    createdAt: daysAgo(5),
    updatedAt: daysAgo(2),
  },
]

const MOCK_MCPS: MCPConnection[] = [
  {
    id: 'mcp-github',
    projectId: 'proj-core',
    name: 'GitHub',
    type: 'github',
    status: 'CONNECTED',
    config: { repo: 'forge-org/forge-core' },
    allowedTools: ['read_file', 'create_pr'],
    scopes: ['repo', 'actions'],
    lastConnectedAt: hoursAgo(3),
    createdAt: daysAgo(90),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'mcp-postgres',
    projectId: 'proj-core',
    name: 'Postgres',
    type: 'postgres',
    status: 'CONNECTED',
    config: { database: 'forgeops' },
    allowedTools: ['query'],
    scopes: ['read', 'write'],
    lastConnectedAt: hoursAgo(1),
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'mcp-redis',
    projectId: 'proj-core',
    name: 'Redis',
    type: 'redis',
    status: 'DISCONNECTED',
    config: { url: 'redis://redis:6379' },
    allowedTools: ['get', 'set'],
    scopes: ['read', 'write'],
    lastConnectedAt: daysAgo(7),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
  {
    id: 'mcp-fs',
    projectId: 'proj-core',
    name: 'Filesystem',
    type: 'filesystem',
    status: 'CONNECTED',
    config: { root: '/workspace/forge-core' },
    allowedTools: ['read_file', 'write_file'],
    scopes: ['project_only'],
    lastConnectedAt: hoursAgo(6),
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(6),
  },
]

// ─────────────────────────────── API functions ───────────────────────────────

/** Parse memory metadata (or return defaults). */
export function parseMetadata(memory: ProjectMemory): MemoryMetadata {
  const meta = (memory.metadata ?? {}) as Partial<MemoryMetadata>
  return {
    tags: meta.tags ?? [],
    pinned: meta.pinned ?? false,
    relatedAgentIds: meta.relatedAgentIds ?? [],
    relatedMcpIds: meta.relatedMcpIds ?? [],
  }
}

export interface MemoryListItem {
  memory: ProjectMemory
  meta: MemoryMetadata
}

/** Fetch all memories of a project, pinned first, newest first. */
export async function getProjectMemories(projectId: string): Promise<MemoryListItem[]> {
  return mockMemories
    .filter((memory) => memory.projectId === projectId)
    .map((memory) => ({ memory, meta: parseMetadata(memory) }))
    .sort((a, b) => {
      if (a.meta.pinned !== b.meta.pinned) return a.meta.pinned ? -1 : 1
      return b.memory.updatedAt.getTime() - a.memory.updatedAt.getTime()
    })
}

/** Build a change-history for a memory (mock; real: audit trail). */
export function buildHistory(memory: ProjectMemory, meta: MemoryMetadata): MemoryChange[] {
  const history: MemoryChange[] = [
    {
      id: `${memory.id}-h1`,
      author: 'Aria Chen',
      action: 'created',
      summary: `Created under ${memory.category}`,
      at: memory.createdAt,
    },
  ]
  if (memory.updatedAt.getTime() !== memory.createdAt.getTime()) {
    history.push({
      id: `${memory.id}-h2`,
      author: 'Aria Chen',
      action: 'updated',
      summary: 'Content edited',
      at: memory.updatedAt,
    })
  }
  if (meta.pinned) {
    history.push({
      id: `${memory.id}-h3`,
      author: 'Aria Chen',
      action: 'pinned',
      summary: 'Pinned to the top of the list',
      at: new Date(memory.updatedAt.getTime() + 60_000),
    })
  }
  return history.sort((a, b) => b.at.getTime() - a.at.getTime())
}

/** Resolve related agents for a memory. */
export function getRelatedAgents(ids: string[]) {
  return mockAgents.filter((agent) => ids.includes(agent.id))
}

/** Resolve related MCP connections for a memory. */
export function getRelatedMcps(ids: string[]) {
  return MOCK_MCPS.filter((mcp) => ids.includes(mcp.id))
}

/** All MCP connections available for the "related to" picker. */
export function getAvailableMcps() {
  return MOCK_MCPS
}

/** All tags used across the project's memories. */
export function collectTags(items: MemoryListItem[]): string[] {
  const tags = new Set<string>()
  for (const item of items) item.meta.tags.forEach((tag) => tags.add(tag))
  return [...tags].sort()
}
