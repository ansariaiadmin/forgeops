import type { Agent, DockerService, MCPConnection, Project } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface ProjectDetail {
  project: Project
  services: DockerService[]
  agents: Agent[]
  mcps: MCPConnection[]
  ownerName: string
}

export interface ProjectWithCounts extends Project {
  servicesCount: number
  agentsCount: number
}

export interface CreateProjectInput {
  name: string
  slug: string
  description?: string | null
  environment: 'DEV' | 'STAGING' | 'PROD'
  techStack?: string[]
  workspaceId: string
  ownerId: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string | null
  environment?: 'DEV' | 'STAGING' | 'PROD'
  techStack?: string[]
  status?: 'ACTIVE' | 'ARCHIVED' | 'DELETED'
  healthScore?: number
}

/**
 * Server-side project detail (used by the SSR pages). Reads from Prisma
 * directly — no HTTP round-trip for the initial render.
 */
export async function getProjectDetail(slug: string): Promise<ProjectDetail | null> {
  const project = await prisma.project.findFirst({
    where: { slug },
    include: {
      owner: { select: { name: true } },
      dockerServices: { orderBy: { name: 'asc' } },
      agents: { orderBy: { createdAt: 'asc' } },
      mcpConnections: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!project) return null

  const { owner, dockerServices, agents, mcpConnections, ...rest } = project
  return {
    project: rest as Project,
    services: dockerServices,
    agents,
    mcps: mcpConnections,
    ownerName: owner.name,
  }
}

/**
 * List all projects with service/agent counts — real Prisma.
 */
export async function getAllProjects(): Promise<ProjectWithCounts[]> {
  const projects = await prisma.project.findMany({
    include: {
      _count: { select: { dockerServices: true, agents: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return projects.map(({ _count, ...project }) => ({
    ...(project as Project),
    servicesCount: _count.dockerServices,
    agentsCount: _count.agents,
  }))
}

/**
 * Get single project by slug with full relations — include agents/docs/services.
 */
export async function getProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug },
    include: {
      owner: true,
      workspace: true,
      dockerServices: true,
      agents: true,
      documents: true,
      memories: true,
      mcpConnections: true,
      ragSources: true,
      tasks: true,
      backups: true,
    },
  })
}

/**
 * Get project by ID with relations.
 */
export async function getProjectById(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      owner: true,
      dockerServices: true,
      agents: true,
      documents: true,
      memories: true,
      mcpConnections: true,
    },
  })
}

/**
 * Create project with validation — slug unique per workspace.
 */
export async function createProject(input: CreateProjectInput): Promise<Project> {
  if (!input.name || input.name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters')
  }
  if (!input.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new Error('Invalid slug format — use lowercase letters, numbers and hyphens')
  }
  if (!input.workspaceId) throw new Error('workspaceId required')
  if (!input.ownerId) throw new Error('ownerId required')

  const existing = await prisma.project.findUnique({
    where: { workspaceId_slug: { workspaceId: input.workspaceId, slug: input.slug } },
  })
  if (existing) {
    throw new Error(`Project with slug "${input.slug}" already exists in this workspace`)
  }

  return prisma.project.create({
    data: {
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description || null,
      environment: input.environment,
      techStack: (input.techStack ?? []) as Prisma.InputJsonValue,
      status: 'ACTIVE',
      healthScore: 0,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
    },
  })
}

/**
 * Update project — partial fields.
 */
export async function updateProject(id: string, data: UpdateProjectInput): Promise<Project> {
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) throw new Error('Project not found')

  return prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.environment !== undefined ? { environment: data.environment } : {}),
      ...(data.techStack !== undefined ? { techStack: data.techStack as Prisma.InputJsonValue } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.healthScore !== undefined ? { healthScore: data.healthScore } : {}),
    },
  })
}

/**
 * Delete project — cascades to children via Prisma onDelete: Cascade.
 */
export async function deleteProject(id: string): Promise<void> {
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) throw new Error('Project not found')

  await prisma.project.delete({ where: { id } })
}

/**
 * Alias for compatibility — used by older code.
 */
export const findMany = getAllProjects
export const findUnique = getProjectBySlug
