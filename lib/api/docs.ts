import type { DocumentType, Project } from '@prisma/client'

import { mockAgents, mockServices } from '@/lib/mock-data'

/**
 * Mock API layer for project documentation.
 *
 * Future REST surface (UI stays unchanged):
 *   GET    /api/projects/[slug]/docs
 *   POST   /api/projects/[slug]/docs
 *   PATCH  /api/projects/[slug]/docs/[id]
 *   GET    /api/projects/[slug]/docs/[id]/versions
 *   POST   /api/projects/[slug]/docs/ai/generate
 *   POST   /api/projects/[slug]/docs/ai/readme
 *   POST   /api/projects/[slug]/docs/ai/api-docs
 */

// ─────────────────────────────── Types ───────────────────────────────

export interface DocVersion {
  version: number
  author: string
  at: Date
  summary: string
  content: string
}

export interface ProjectDocument {
  id: string
  title: string
  type: DocumentType
  path: string
  version: number
  createdAt: Date
  updatedAt: Date
  content: string
  versions: DocVersion[]
}

export interface AiGenerationResult {
  content: string
  message: string
}

// ─────────────────────────────── Labels ───────────────────────────────

export const DOC_TYPE_OPTIONS: DocumentType[] = [
  'README',
  'API_DOCS',
  'ARCHITECTURE',
  'GUIDE',
  'OTHER',
]

export const DOC_TYPE_LABEL: Record<DocumentType, string> = {
  README: 'README',
  API_DOCS: 'API Docs',
  ARCHITECTURE: 'Architecture',
  GUIDE: 'Guide',
  OTHER: 'Other',
}

export const DOC_TYPE_BADGE: Record<DocumentType, string> = {
  README: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  API_DOCS: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  ARCHITECTURE: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  GUIDE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  OTHER: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
}

// ─────────────────────────────── Mock documents ───────────────────────────────

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)

const README_V1 = [
  '# forge-core',
  '',
  'Core orchestration engine for the ForgeOps platform.',
  '',
  '## Features',
  '',
  '- Deployments',
  '- Agents',
  '',
].join('\n')

const README_V2 = [
  '# forge-core',
  '',
  'Core orchestration engine for the ForgeOps platform — manages deployments, agents and environments.',
  '',
  '## Features',
  '',
  '- Multi-environment deployments (dev / staging / prod)',
  '- Agent orchestration with MCP tool access',
  '',
].join('\n')

const README_V3 = [
  '# forge-core',
  '',
  'Core orchestration engine for the ForgeOps platform — manages deployments, agents and environments.',
  '',
  '## Features',
  '',
  '- Multi-environment deployments (dev / staging / prod)',
  '- Agent orchestration with MCP tool access',
  '- Health monitoring with automatic rollbacks',
  '',
  '## Quick start',
  '',
  '```bash',
  'npm install',
  'npm run dev',
  '```',
  '',
  '## Stack',
  '',
  '| Layer | Tech |',
  '| --- | --- |',
  '| Frontend | Next.js 15, React 19, Tailwind CSS |',
  '| Backend | Node.js, TypeScript |',
  '| Infra | Docker, Docker Compose |',
  '',
].join('\n')

const API_V4 = [
  '# API Reference',
  '',
  '## Endpoints',
  '',
  '| Method | Path | Description |',
  '| --- | --- | --- |',
  '| GET | /api/health | Service status and uptime |',
  '| POST | /api/deploy | Enqueue a deployment |',
  '| GET | /api/agents | List project agents |',
  '',
  '## Errors',
  '',
  'All errors use the `{ error: string }` envelope with proper HTTP status codes.',
  '',
].join('\n')

const API_V5 = [
  '# API Reference',
  '',
  '## Endpoints',
  '',
  '| Method | Path | Description |',
  '| --- | --- | --- |',
  '| GET | /api/health | Service status and uptime |',
  '| POST | /api/deploy | Enqueue a deployment |',
  '| GET | /api/agents | List project agents |',
  '| POST | /api/agents/:id/run | Run a task with an agent |',
  '',
  '## Errors',
  '',
  'All errors use the `{ error: string }` envelope with proper HTTP status codes.',
  '',
  '## Rate limits',
  '',
  'Planned: 100 req/min per API key (Redis token bucket).',
  '',
].join('\n')

const ARCH_V1 = [
  '# Architecture',
  '',
  '## Layers',
  '',
  '- **web** — Next.js UI, proxies to the API',
  '- **api** — edge routes with Zod validation',
  '- **worker** — background jobs',
  '',
].join('\n')

const ARCH_V2 = [
  '# Architecture',
  '',
  '## Layers',
  '',
  '- **web** — Next.js UI, proxies to the API',
  '- **api** — edge routes with Zod validation',
  '- **worker** — background jobs, talks to Docker directly',
  '',
  '## Data flow',
  '',
  '1. Client calls `/api/deploy`',
  '2. Route validates with Zod and enqueues a job',
  '3. Worker picks up the job and talks to Docker',
  '',
  '> Rule: services never import each other — they communicate through the job queue.',
  '',
].join('\n')

const GUIDE_V1 = [
  '# Onboarding Guide',
  '',
  'Welcome to forge-core! This guide gets you from zero to a running dev environment.',
  '',
  '## 1. Prerequisites',
  '',
  '- Node.js 20+',
  '- Docker & Docker Compose',
  '',
  '## 2. First run',
  '',
  '```bash',
  'npm install',
  'cp .env.example .env',
  'npm run db:migrate',
  'npm run dev',
  '```',
  '',
].join('\n')

const RELEASE_V4 = [
  '# Release Notes — v2.14.0',
  '',
  '## Highlights',
  '',
  '- Optimistic UI in the project list',
  '- Worker backpressure fixes',
  '',
  '## Breaking changes',
  '',
  '- `DATABASE_URL` now required in all environments.',
  '',
].join('\n')

const MOCK_DOCS: ProjectDocument[] = [
  {
    id: 'doc-readme',
    title: 'README',
    type: 'README',
    path: 'README.md',
    version: 3,
    createdAt: daysAgo(90),
    updatedAt: daysAgo(2),
    content: README_V3,
    versions: [
      {
        version: 3,
        author: 'Aria Chen',
        at: daysAgo(2),
        summary: 'Added Stack table and quick start',
        content: README_V3,
      },
      {
        version: 2,
        author: 'John Alvarez',
        at: daysAgo(14),
        summary: 'Expanded features section',
        content: README_V2,
      },
      {
        version: 1,
        author: 'Aria Chen',
        at: daysAgo(90),
        summary: 'Initial version',
        content: README_V1,
      },
    ],
  },
  {
    id: 'doc-api',
    title: 'API Reference',
    type: 'API_DOCS',
    path: 'docs/api.md',
    version: 5,
    createdAt: daysAgo(80),
    updatedAt: hoursAgo(6),
    content: API_V5,
    versions: [
      {
        version: 5,
        author: 'Aria Chen',
        at: hoursAgo(6),
        summary: 'Documented agent run endpoint + rate limits',
        content: API_V5,
      },
      {
        version: 4,
        author: 'Maria Kim',
        at: daysAgo(20),
        summary: 'Added error envelope section',
        content: API_V4,
      },
    ],
  },
  {
    id: 'doc-arch',
    title: 'Architecture',
    type: 'ARCHITECTURE',
    path: 'docs/architecture.md',
    version: 2,
    createdAt: daysAgo(70),
    updatedAt: daysAgo(12),
    content: ARCH_V2,
    versions: [
      {
        version: 2,
        author: 'Sam Osei',
        at: daysAgo(12),
        summary: 'Added data flow and service rule',
        content: ARCH_V2,
      },
      {
        version: 1,
        author: 'Aria Chen',
        at: daysAgo(70),
        summary: 'Initial architecture notes',
        content: ARCH_V1,
      },
    ],
  },
  {
    id: 'doc-guide',
    title: 'Onboarding Guide',
    type: 'GUIDE',
    path: 'docs/onboarding.md',
    version: 1,
    createdAt: daysAgo(30),
    updatedAt: daysAgo(30),
    content: GUIDE_V1,
    versions: [
      {
        version: 1,
        author: 'Maria Kim',
        at: daysAgo(30),
        summary: 'Initial guide',
        content: GUIDE_V1,
      },
    ],
  },
  {
    id: 'doc-release',
    title: 'Release Notes',
    type: 'OTHER',
    path: 'docs/release-notes.md',
    version: 4,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(5),
    content: RELEASE_V4,
    versions: [
      {
        version: 4,
        author: 'John Alvarez',
        at: daysAgo(5),
        summary: 'v2.14.0 notes',
        content: RELEASE_V4,
      },
    ],
  },
]

// ─────────────────────────────── API functions ───────────────────────────────

/** Fetch all documents of a project, most recently edited first. */
export async function getProjectDocuments(_projectId: string): Promise<ProjectDocument[]> {
  return [...MOCK_DOCS]
    .filter((doc) => doc.id.startsWith('doc-'))
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

/** Create a new document (mock; real: POST /api/projects/[slug]/docs). */
export async function createDocument(
  _projectId: string,
  values: { title: string; type: DocumentType; path: string; content: string },
): Promise<ProjectDocument> {
  const now = new Date()
  return {
    id: `doc-${Math.random().toString(36).slice(2, 8)}`,
    title: values.title,
    type: values.type,
    path: values.path,
    version: 1,
    createdAt: now,
    updatedAt: now,
    content: values.content,
    versions: [
      {
        version: 1,
        author: 'Aria Chen',
        at: now,
        summary: 'Initial version',
        content: values.content,
      },
    ],
  }
}

/** Save a document — bumps the version and records a history entry. */
export function saveDocument(
  doc: ProjectDocument,
  newContent: string,
  author = 'Aria Chen',
): ProjectDocument {
  const now = new Date()
  return {
    ...doc,
    content: newContent,
    updatedAt: now,
    version: doc.version + 1,
    versions: [
      {
        version: doc.version + 1,
        author,
        at: now,
        summary: 'Edited content',
        content: newContent,
      },
      ...doc.versions,
    ],
  }
}

// ─────────────────────────────── AI-assisted (mock) ───────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** "Generate with AI" — uses the Documenter agent (mock; real: POST .../docs/ai/generate). */
export async function generateWithAi(
  project: Project,
  type: DocumentType,
  topic: string,
): Promise<AiGenerationResult> {
  await delay(1600)
  const documenter = mockAgents.find((agent) => agent.type === 'DOCUMENTER')

  const heading = topic || DOC_TYPE_LABEL[type]
  const content = [
    `# ${heading}`,
    '',
    `> Drafted by **${documenter?.name ?? 'Documenter'}** (${documenter?.model ?? 'gpt-4o-mini'}) for ${project.name}.`,
    '',
    '## Overview',
    '',
    `This document covers ${topic || heading.toLowerCase()} for the ${project.name} project.`,
    '',
    '## Key points',
    '',
    '- Point one: concise and actionable',
    '- Point two: links to related code and docs',
    '- Point three: open questions marked with TODO',
    '',
    '## References',
    '',
    '- `README.md`',
    '- `docs/architecture.md`',
    '',
  ].join('\n')

  return {
    content,
    message: `${documenter?.name ?? 'Documenter'} drafted a ${DOC_TYPE_LABEL[type].toLowerCase()} based on the project context.`,
  }
}

/** "Update README" — merges live project state into the README (mock). */
export async function updateReadme(
  project: Project,
  currentContent: string,
): Promise<AiGenerationResult> {
  await delay(1500)
  const services = mockServices.filter((service) => service.projectId === project.id)
  const stack = Array.isArray(project.techStack) ? (project.techStack as string[]).join(', ') : '—'

  const servicesTable = [
    '| Service | Image | Status |',
    '| --- | --- | --- |',
    ...services.map((service) => `| ${service.name} | \`${service.image}\` | ${service.status} |`),
  ].join('\n')

  const content = [
    ...(currentContent || `# ${project.name}`).split('\n'),
    '',
    '## Current services',
    '',
    servicesTable,
    '',
    '## Tech stack',
    '',
    stack,
    '',
    '> Updated automatically by the DevOps agent from live project state.',
    '',
  ].join('\n')

  return {
    content,
    message: 'README refreshed with live services, health and stack — review and save.',
  }
}

/** "Generate API Docs" — documents the discovered API routes (mock). */
export async function generateApiDocs(project: Project): Promise<AiGenerationResult> {
  await delay(1700)
  const content = [
    '# API Reference',
    '',
    `> Generated from the codebase of ${project.name}.`,
    '',
    '## Endpoints',
    '',
    '| Method | Path | Description |',
    '| --- | --- | --- |',
    '| GET | /api/health | Service status and uptime |',
    '| POST | /api/deploy | Enqueue a deployment |',
    '| GET | /api/agents | List project agents |',
    '| POST | /api/agents/:id/run | Run a task with an agent |',
    '',
    '## Request envelope',
    '',
    '```json',
    '{ "data": { }, "error": null, "status": "success" }',
    '```',
    '',
    '## Errors',
    '',
    '| Code | Meaning |',
    '| --- | --- |',
    '| 400 | Validation failed |',
    '| 401 | Unauthenticated |',
    '| 404 | Not found |',
    '| 409 | Conflict |',
    '',
  ].join('\n')

  return {
    content,
    message: 'API reference generated from the discovered routes in the context tree.',
  }
}
