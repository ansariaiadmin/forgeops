import type { Agent, DockerService, MCPConnection, Project } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface ProjectDetail {
  project: Project
  services: DockerService[]
  agents: Agent[]
  mcps: MCPConnection[]
  ownerName: string
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
    project: rest,
    services: dockerServices,
    agents,
    mcps: mcpConnections,
    ownerName: owner.name,
  }
}
