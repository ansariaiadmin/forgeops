// ForgeOps — full demo seed (idempotent).
// Usage: npm run db:seed
// Seeds: users, workspace, projects, services, agents, jobs, memories,
// MCP connections, documents, RAG sources, tasks, backups, audit logs.

import { Prisma, PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import {
  mockAgents,
  mockAuditLogs,
  mockJobs,
  mockMcpConnections,
  mockProjects,
  mockServices,
  mockUsers,
} from '../lib/mock-data'

const prisma = new PrismaClient()

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)

const seedMemories = [
  {
    id: 'mem-001',
    category: 'ARCHITECTURE' as const,
    title: 'Service boundaries and data flow',
    content:
      '# Service boundaries\n\nforge-core is split into three layers: **web** (Next.js), **api** (edge routes) and **worker** (background jobs).\n\n> Rule: services never import each other — they communicate through the job queue.',
    metadata: {
      tags: ['architecture', 'services'],
      pinned: true,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: ['mcp-github'],
    },
  },
  {
    id: 'mem-002',
    category: 'DECISION' as const,
    title: 'ADR-014: Keep REST over GraphQL',
    content:
      '## Decision\n\nStay with **REST + OpenAPI** — the API surface is small and stable, and tooling interoperability matters more than client-side flexibility.\n\n## Consequences\n\n- + Caching is simpler (per-route)\n- − Clients over-fetch on list views',
    metadata: {
      tags: ['adr', 'api'],
      pinned: false,
      relatedAgentIds: ['agt-review'],
      relatedMcpIds: [],
    },
  },
  {
    id: 'mem-003',
    category: 'BUG' as const,
    title: 'Race condition in deploy worker',
    content:
      '**Status:** investigating — two deploys can race on `desired_version`.\n\nFix: serialize with a per-service advisory lock in Postgres.',
    metadata: {
      tags: ['bug', 'concurrency'],
      pinned: true,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: [],
    },
  },
  {
    id: 'mem-004',
    category: 'CONVENTION' as const,
    title: 'Commit message conventions',
    content:
      'Use **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`. Branch names: `feat/`, `fix/`, `chore/` prefix, kebab-case.',
    metadata: {
      tags: ['git', 'workflow'],
      pinned: false,
      relatedAgentIds: ['agt-review'],
      relatedMcpIds: ['mcp-github'],
    },
  },
  {
    id: 'mem-005',
    category: 'TODO' as const,
    title: 'Migrate legacy-billing to forge-core',
    content:
      '- [ ] Export data from legacy-billing\n- [ ] Map customer schema\n- [ ] Cutover with feature flag `billing-v2`\n- [ ] Sunset after 30 days of dual-run',
    metadata: {
      tags: ['migration', 'billing'],
      pinned: false,
      relatedAgentIds: ['agt-builder'],
      relatedMcpIds: [],
    },
  },
  {
    id: 'mem-006',
    category: 'TODO' as const,
    title: 'Add rate limiting to public API',
    content:
      'Public endpoints have **no rate limiting**. Plan: Redis-based token bucket, 100 req/min per key.',
    metadata: {
      tags: ['api', 'security'],
      pinned: false,
      relatedAgentIds: [],
      relatedMcpIds: ['mcp-redis'],
    },
  },
]

const seedDocs = [
  {
    id: 'doc-readme',
    title: 'README',
    type: 'README' as const,
    path: 'README.md',
    version: 3,
    content:
      '# forge-core\n\nCore orchestration engine for the ForgeOps platform — manages deployments, agents and environments.\n\n## Features\n\n- Multi-environment deployments (dev / staging / prod)\n- Agent orchestration with MCP tool access\n- Health monitoring with automatic rollbacks\n\n## Quick start\n\n```bash\nnpm install\nnpm run dev\n```',
  },
  {
    id: 'doc-api',
    title: 'API Reference',
    type: 'API_DOCS' as const,
    path: 'docs/api.md',
    version: 5,
    content:
      '# API Reference\n\n| Method | Path | Description |\n| --- | --- | --- |\n| GET | /api/health | Service status |\n| POST | /api/deploy | Enqueue a deployment |\n| GET | /api/agents | List project agents |\n\nAll errors use the `{ error: string }` envelope.',
  },
  {
    id: 'doc-arch',
    title: 'Architecture',
    type: 'ARCHITECTURE' as const,
    path: 'docs/architecture.md',
    version: 2,
    content:
      '# Architecture\n\n## Layers\n\n- **web** — Next.js UI\n- **api** — edge routes with Zod validation\n- **worker** — background jobs, talks to Docker directly\n\n> Rule: services never import each other — they communicate through the job queue.',
  },
  {
    id: 'doc-guide',
    title: 'Onboarding Guide',
    type: 'GUIDE' as const,
    path: 'docs/onboarding.md',
    version: 1,
    content:
      '# Onboarding Guide\n\n## First run\n\n```bash\nnpm install\ncp .env.example .env\nnpm run db:migrate\nnpm run dev\n```',
  },
  {
    id: 'doc-release',
    title: 'Release Notes',
    type: 'OTHER' as const,
    path: 'docs/release-notes.md',
    version: 4,
    content:
      '# Release Notes — v2.14.0\n\n## Highlights\n\n- Optimistic UI in the project list\n- Worker backpressure fixes',
  },
]

const seedRagSources = [
  {
    id: 'rag-001',
    type: 'FILE' as const,
    path: 'README.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(2),
    chunks: [
      'forge-core is the core orchestration engine for the ForgeOps platform, managing deployments, agents and environments.',
      'Multi-environment deployments to dev, staging and production are coordinated through a Redis-backed job queue.',
      'The platform runs three services: web (Next.js UI), api (edge routes) and worker (background jobs).',
      'Health monitoring watches every container and automatically rolls back deployments that fail their health checks.',
      'Authentication uses JWT with a rotating refresh token, signed with the same secret as the NextAuth session cookie.',
    ],
  },
  {
    id: 'rag-002',
    type: 'DOCUMENT' as const,
    path: 'docs/api.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(5),
    chunks: [
      'POST /api/deploy accepts a project and environment, validates the payload with Zod and enqueues a deploy job.',
      'GET /api/health returns the current service status, uptime and the last deployment result.',
      'API responses use consistent envelopes: data, error and status, returning 202 for accepted async jobs.',
      'Rate limiting is planned: Redis-based token bucket at 100 requests per minute per API key.',
    ],
  },
  {
    id: 'rag-003',
    type: 'DOCUMENT' as const,
    path: 'docs/architecture.md',
    isIndexed: true,
    lastIndexedAt: daysAgo(12),
    chunks: [
      'Architecture rule: services never import each other directly — all cross-service work flows through the job queue.',
      'The database is a single shared Postgres 16 instance with one schema per service.',
      'Secrets are stored in environment variables and injected at container start; never committed to the repository.',
      'Observability: every job writes structured logs with a correlation id so a single deploy can be traced end-to-end.',
    ],
  },
  {
    id: 'rag-004',
    type: 'PDF' as const,
    path: 'reports/spec-v2.pdf',
    isIndexed: false,
    lastIndexedAt: null,
    chunks: null,
  },
  {
    id: 'rag-005',
    type: 'URL' as const,
    path: 'https://forgeops.dev/guides/deploy',
    isIndexed: false,
    lastIndexedAt: null,
    chunks: null,
  },
]

const seedTasks = [
  {
    id: 'task-001',
    projectId: 'proj-core',
    title: 'Fix flaky e2e test in checkout flow',
    description: '3 race conditions identified; all 48 tests should go green.',
    status: 'RUNNING' as const,
    priority: 'HIGH' as const,
    assignedTo: 'usr-aria',
    assignedAgent: 'agt-builder',
    metadata: { source: 'agent:builder' },
  },
  {
    id: 'task-002',
    projectId: 'proj-api',
    title: 'Document new rate-limit headers',
    description: 'Add X-RateLimit-* headers to the API reference.',
    status: 'BACKLOG' as const,
    priority: 'MEDIUM' as const,
    assignedTo: 'usr-maria',
    assignedAgent: null,
    metadata: null,
  },
  {
    id: 'task-003',
    projectId: 'proj-front',
    title: 'Optimistic UI for project list',
    description: 'Implemented with rollback on failure.',
    status: 'DONE' as const,
    priority: 'MEDIUM' as const,
    assignedTo: 'usr-john',
    assignedAgent: 'agt-builder',
    metadata: { pr: '#483' },
  },
  {
    id: 'task-004',
    projectId: 'proj-legacy',
    title: 'Extract payment module from monolith',
    description: 'Blocked by circular dependency between billing and subscription.',
    status: 'FAILED' as const,
    priority: 'CRITICAL' as const,
    assignedTo: 'usr-maria',
    assignedAgent: 'agt-builder',
    metadata: null,
  },
]

async function main() {
  console.log('🧹 Clearing existing data…')
  await prisma.auditLog.deleteMany()
  await prisma.task.deleteMany()
  await prisma.rAGSource.deleteMany()
  await prisma.document.deleteMany()
  await prisma.agentJob.deleteMany()
  await prisma.agent.deleteMany()
  await prisma.mCPConnection.deleteMany()
  await prisma.projectMemory.deleteMany()
  await prisma.environmentVariable.deleteMany()
  await prisma.dockerService.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.backup.deleteMany()
  await prisma.project.deleteMany()
  await prisma.workspace.deleteMany()
  await prisma.user.deleteMany()

  console.log('👤 Seeding users…')
  const admin = await prisma.user.create({
    data: {
      email: 'admin@forgeops.dev',
      password: await bcrypt.hash('Admin@12345', 10),
      name: 'ForgeOps Admin',
      role: 'OWNER',
      isActive: true,
    },
  })
  const userMap: Record<string, string> = { [admin.id]: admin.id }
  for (const user of mockUsers) {
    const created = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: await bcrypt.hash('Dev@12345', 10),
        name: user.name,
        role: user.id === 'usr-aria' ? 'ADMIN' : user.id === 'usr-sam' ? 'VIEWER' : 'DEVELOPER',
        isActive: true,
      },
    })
    userMap[user.id] = created.id
  }
  const login = (id: string) => userMap[id] ?? admin.id

  console.log('🏢 Seeding workspace…')
  const workspace = await prisma.workspace.create({
    data: {
      id: 'ws-main',
      name: 'Main Workspace',
      slug: 'main',
      description: 'Primary ForgeOps workspace',
      ownerId: admin.id,
    },
  })

  console.log(`📦 Seeding ${mockProjects.length} projects…`)
  for (const project of mockProjects) {
    await prisma.project.create({
      data: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        workspaceId: workspace.id,
        ownerId: login(project.ownerId),
        status: project.status,
        environment: project.environment,
        techStack: project.techStack as never,
        healthScore: project.healthScore,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    })
  }

  console.log(`🐳 Seeding ${mockServices.length} docker services…`)
  for (const service of mockServices) {
    await prisma.dockerService.create({
      data: {
        id: service.id,
        projectId: service.projectId,
        name: service.name,
        image: service.image,
        containerId: service.containerId,
        status: service.status,
        ports: service.ports as never,
        volumes: service.volumes as never,
        networks: service.networks as never,
        healthStatus: service.healthStatus,
        createdAt: service.createdAt,
        updatedAt: service.updatedAt,
      },
    })
  }

  console.log(`🤖 Seeding ${mockAgents.length} agents…`)
  for (const agent of mockAgents) {
    await prisma.agent.create({
      data: {
        id: agent.id,
        name: agent.name,
        type: agent.type,
        projectId: agent.projectId,
        model: agent.model,
        systemPrompt: agent.systemPrompt,
        tools: agent.tools as never,
        mcpIds: agent.mcpIds as never,
        status: agent.status,
        totalTokensUsed: agent.totalTokensUsed,
        totalCost: agent.totalCost,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    })
  }

  console.log(`⚙️ Seeding ${mockJobs.length} agent jobs…`)
  for (const job of mockJobs) {
    await prisma.agentJob.create({
      data: {
        id: job.id,
        agentId: job.agentId,
        projectId: job.projectId,
        task: job.task,
        status: job.status,
        result: job.result,
        error: job.error,
        tokensUsed: job.tokensUsed,
        cost: job.cost,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    })
  }

  console.log(`🧠 Seeding ${seedMemories.length} project memories…`)
  for (const memory of seedMemories) {
    await prisma.projectMemory.create({
      data: {
        id: memory.id,
        projectId: 'proj-core',
        category: memory.category,
        title: memory.title,
        content: memory.content,
        metadata: memory.metadata as never,
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(6),
      },
    })
  }

  console.log(`🔌 Seeding ${mockMcpConnections.length} MCP connections…`)
  for (const mcp of mockMcpConnections) {
    await prisma.mCPConnection.create({
      data: {
        id: mcp.id,
        projectId: mcp.projectId,
        name: mcp.name,
        type: mcp.type,
        status: mcp.status,
        config: mcp.config as never,
        allowedTools: mcp.allowedTools as never,
        scopes: mcp.scopes as never,
        lastConnectedAt: mcp.lastConnectedAt,
        createdAt: mcp.createdAt,
        updatedAt: mcp.updatedAt,
      },
    })
  }

  console.log(`📚 Seeding ${seedDocs.length} documents…`)
  for (const doc of seedDocs) {
    await prisma.document.create({
      data: {
        id: doc.id,
        projectId: 'proj-core',
        title: doc.title,
        type: doc.type,
        path: doc.path,
        version: doc.version,
        content: doc.content,
        lastEditedBy: userMap['usr-aria'],
        createdAt: daysAgo(60),
        updatedAt: doc.id === 'doc-api' ? hoursAgo(6) : daysAgo(3),
      },
    })
  }

  console.log(`🔎 Seeding ${seedRagSources.length} RAG sources…`)
  for (const source of seedRagSources) {
    await prisma.rAGSource.create({
      data: {
        id: source.id,
        projectId: 'proj-core',
        type: source.type,
        path: source.path,
        isIndexed: source.isIndexed,
        lastIndexedAt: source.lastIndexedAt,
        chunks: (source.chunks as Prisma.InputJsonValue | null) ?? Prisma.JsonNull,
        embeddings: Prisma.JsonNull,
        createdAt: daysAgo(30),
        updatedAt: source.lastIndexedAt ?? daysAgo(1),
      },
    })
  }

  console.log(`📋 Seeding ${seedTasks.length} tasks…`)
  for (const task of seedTasks) {
    await prisma.task.create({
      data: {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignedTo: task.assignedTo ? userMap[task.assignedTo] : null,
        assignedAgent: task.assignedAgent,
        metadata: task.metadata as never,
        completedAt: task.status === 'DONE' ? daysAgo(2) : null,
        createdAt: daysAgo(7),
        updatedAt: hoursAgo(12),
      },
    })
  }

  console.log(`💾 Seeding 2 backups…`)
  await prisma.backup.createMany({
    data: [
      {
        id: 'bak-001',
        projectId: 'proj-core',
        type: 'DATABASE',
        path: 's3://forgeops-backups/prod-db-2026-08-18.sql.gz',
        size: 1_073_741_824, // 1GB — fits in INT
        status: 'READY',
        createdAt: hoursAgo(2),
      },
      {
        id: 'bak-002',
        projectId: 'proj-core',
        type: 'CONFIG',
        path: 's3://forgeops-backups/config-2026-08-17.tar.gz',
        size: 4_194_304,
        status: 'READY',
        createdAt: daysAgo(1),
      },
    ],
  })

  console.log(`👥 Seeding members…`)
  const memberPairs: Array<{
    projectId: string
    userId: string
    role: 'OWNER' | 'ADMIN'
  }> = mockProjects.map((project) => ({
    projectId: project.id,
    userId: login(project.ownerId),
    role: 'OWNER' as const,
  }))
  memberPairs.push({ projectId: 'proj-core', userId: admin.id, role: 'ADMIN' })
  for (const member of memberPairs) {
    await prisma.projectMember.create({ data: member })
  }

  console.log(`🧾 Seeding ${mockAuditLogs.length} audit logs…`)
  for (const log of mockAuditLogs) {
    await prisma.auditLog.create({
      data: {
        id: log.id,
        userId: log.userId ? userMap[log.userId] : null,
        projectId: log.projectId,
        action: log.action,
        resource: log.resource,
        details: log.details as never,
        ip: log.ip,
        userAgent: log.userAgent,
        createdAt: log.createdAt,
      },
    })
  }

  console.log('\n✅ Seed complete!')
  console.log('   Admin:  admin@forgeops.dev / Admin@12345')
  console.log(
    '   Demo:   aria@forgeops.dev / john@forgeops.dev / maria@forgeops.dev / sam@forgeops.dev (Dev@12345)',
  )
}

main()
  .catch((error) => {
    console.error('Seeding failed:', error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
