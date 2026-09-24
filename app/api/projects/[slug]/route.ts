import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { projectFormSchema } from '@/lib/validations/project'

/**
 * GET    /api/projects/[slug] — project detail (owner, services, agents, MCPs)
 * PATCH  /api/projects/[slug] — update editable fields
 * DELETE /api/projects/[slug] — delete (cascades to children)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({
    where: { slug },
    include: {
      owner: { select: { name: true } },
      dockerServices: { orderBy: { name: 'asc' } },
      agents: { orderBy: { createdAt: 'asc' } },
      mcpConnections: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  return NextResponse.json({ project })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'project:update')
  if (denied) return denied

  const { slug } = await params
  const body = (await request.json().catch(() => null)) as unknown
  const parsed = projectFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const existing = await prisma.project.findFirst({ where: { slug } })
  if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const project = await prisma.project.update({
    where: { id: existing.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      environment: parsed.data.environment,
      techStack: parsed.data.techStack as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ project })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'project:delete')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  await prisma.project.delete({ where: { id: project.id } })
  await recordAudit({
    userId: user.id,
    projectId: project.id,
    action: 'project.deleted',
    resource: `project:${project.slug}`,
    request,
  })
  return NextResponse.json({ success: true })
}
