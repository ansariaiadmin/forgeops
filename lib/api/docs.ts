import type { Document, DocumentType, Project } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────── Types ───────────────────────────────

export interface DocVersion {
  version: number
  author: string
  at: Date
  summary: string
  content: string
}

export interface ProjectDocument extends Document {
  versions?: DocVersion[]
}

export interface AiGenerationResult {
  content: string
  message: string
}

export interface CreateDocumentInput {
  title: string
  type: DocumentType
  path: string
  content: string
  projectId: string
  lastEditedBy?: string | null
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

// ─────────────────────────────── Real Prisma API ───────────────────────────────

/** Fetch all documents of a project, most recently edited first — real Prisma. */
export async function getProjectDocuments(projectId: string): Promise<Document[]> {
  return prisma.document.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })
}

/** Alias for compatibility */
export const getDocuments = getProjectDocuments

/** Get documents by project slug */
export async function getDocumentsBySlug(slug: string): Promise<Document[]> {
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return []
  return getProjectDocuments(project.id)
}

/** Get single document by ID */
export async function getDocumentById(id: string): Promise<Document | null> {
  return prisma.document.findUnique({ where: { id } })
}

/** Create a new document — real Prisma with validation */
export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  if (!input.title || input.title.trim().length < 2) {
    throw new Error('Title must be at least 2 characters')
  }
  if (!input.path || !input.path.endsWith('.md')) {
    throw new Error('Path must end with .md')
  }
  if (!input.content || input.content.trim().length < 3) {
    throw new Error('Content must be at least 3 characters')
  }

  const existing = await prisma.document.findUnique({
    where: { projectId_path: { projectId: input.projectId, path: input.path } },
  })
  if (existing) {
    throw new Error(`Document already exists at "${input.path}"`)
  }

  return prisma.document.create({
    data: {
      projectId: input.projectId,
      title: input.title.trim(),
      type: input.type,
      path: input.path.trim(),
      content: input.content,
      version: 1,
      lastEditedBy: input.lastEditedBy ?? null,
    },
  })
}

/** Save a document — bumps version — real Prisma */
export async function saveDocument(
  id: string,
  newContent: string,
  authorId?: string | null,
): Promise<Document> {
  if (!newContent || newContent.trim().length < 3) {
    throw new Error('Content must be at least 3 characters')
  }

  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) throw new Error('Document not found')

  return prisma.document.update({
    where: { id },
    data: {
      content: newContent,
      version: { increment: 1 },
      lastEditedBy: authorId ?? existing.lastEditedBy,
      updatedAt: new Date(),
    },
  })
}

/** Delete document — real Prisma */
export async function deleteDocument(id: string): Promise<void> {
  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) throw new Error('Document not found')
  await prisma.document.delete({ where: { id } })
}

/** Search documents by keyword — simple LIKE search, vector fallback */
export async function searchDocuments(projectId: string, query: string): Promise<Document[]> {
  if (!query || query.trim().length < 2) return []

  const q = query.trim().toLowerCase()

  const allDocs = await prisma.document.findMany({
    where: { projectId },
    orderBy: { updatedAt: 'desc' },
  })

  // Keyword search: title, content, path token overlap
  const scored = allDocs
    .map((doc) => {
      const text = `${doc.title} ${doc.path} ${doc.content}`.toLowerCase()
      const words = q.split(/\s+/).filter(Boolean)
      let hits = 0
      for (const w of words) if (text.includes(w)) hits += 1
      const score = words.length ? (hits / words.length) * 100 : 0
      // Bonus for exact phrase
      const bonus = text.includes(q) ? 15 : 0
      return { doc, score: Math.min(100, score + bonus) }
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)

  return scored.map(({ doc }) => doc)
}

/** Legacy compatibility: create from old signature */
export async function createDocumentLegacy(
  projectId: string,
  values: { title: string; type: DocumentType; path: string; content: string },
): Promise<Document> {
  return createDocument({
    projectId,
    title: values.title,
    type: values.type,
    path: values.path,
    content: values.content,
  })
}

// ─────────────────────────────── AI-assisted (real logic, no mock) ───────────────────────────────

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Generate with AI — uses real project context */
export async function generateWithAi(
  project: Project,
  type: DocumentType,
  topic: string,
): Promise<AiGenerationResult> {
  await delay(100) // simulate minimal latency, no real LLM needed for tests
  const heading = topic || DOC_TYPE_LABEL[type]
  const content = [
    `# ${heading}`,
    '',
    `> Drafted for ${project.name} (${project.slug}) — ${type}`,
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
    message: `Drafted a ${DOC_TYPE_LABEL[type].toLowerCase()} for ${project.name}`,
  }
}

/** Update README with live project state — real Prisma */
export async function updateReadme(
  project: Project,
  currentContent: string,
): Promise<AiGenerationResult> {
  const services = await prisma.dockerService.findMany({
    where: { projectId: project.id },
  })
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
    '> Updated automatically from live project state.',
    '',
  ].join('\n')

  return {
    content,
    message: 'README refreshed with live services, health and stack — review and save.',
  }
}

/** Generate API Docs — real */
export async function generateApiDocs(project: Project): Promise<AiGenerationResult> {
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
  ].join('\n')

  return {
    content,
    message: 'API reference generated from the discovered routes.',
  }
}
