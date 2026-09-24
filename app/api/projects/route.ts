import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { projectFormSchema } from '@/lib/validations/project'

/**
 * GET /api/projects — list all projects (with service/agent counts).
 * POST /api/projects — create a project (Zod-validated).
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projects = await prisma.project.findMany({
    include: { _count: { select: { dockerServices: true, agents: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  const payload = projects.map(({ _count, ...project }) => ({
    ...project,
    servicesCount: _count.dockerServices,
    agentsCount: _count.agents,
  }))

  return NextResponse.json({ projects: payload })
}

export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'project:create')
  if (denied) return denied

  const body = (await request.json().catch(() => null)) as unknown
  const parsed = projectFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const workspace = await prisma.workspace.findFirst()
  if (!workspace) {
    return NextResponse.json(
      { error: 'No workspace found — run `npm run db:seed` first.' },
      { status: 500 },
    )
  }

  // Slug must be unique within the workspace.
  const existing = await prisma.project.findUnique({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: parsed.data.slug } },
  })
  if (existing) {
    return NextResponse.json(
      { error: `A project with the slug "${parsed.data.slug}" already exists.` },
      { status: 409 },
    )
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description || null,
        environment: parsed.data.environment,
        techStack: parsed.data.techStack as Prisma.InputJsonValue,
        status: 'ACTIVE',
        healthScore: 0,
        workspaceId: workspace.id,
        ownerId: user.id,
      },
    })
    await recordAudit({
      userId: user.id,
      projectId: project.id,
      action: 'project.created',
      resource: `project:${project.slug}`,
      details: { name: project.name, environment: project.environment },
      request,
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch {
    // Error handled, no console
    // logger.error('[api:projects] create failed', error)
    return NextResponse.json({ error: 'Failed to create project.' }, { status: 500 })
  }
}
