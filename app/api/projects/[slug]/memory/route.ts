import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { memoryFormSchema } from '@/lib/validations/memory'

/**
 * GET  /api/projects/[slug]/memory — list memories (pinned first)
 * POST /api/projects/[slug]/memory — create a memory
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const memories = await prisma.projectMemory.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
  })
  // Pinned first (metadata.pinned === true), newest first within groups.
  const sorted = [...memories].sort((a, b) => {
    const aPinned = (a.metadata as { pinned?: boolean } | null)?.pinned ?? false
    const bPinned = (b.metadata as { pinned?: boolean } | null)?.pinned ?? false
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return b.updatedAt.getTime() - a.updatedAt.getTime()
  })
  return NextResponse.json({ memories: sorted })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'memory:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = memoryFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const memory = await prisma.projectMemory.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      metadata: {
        tags: [],
        pinned: false,
        relatedAgentIds: [],
        relatedMcpIds: [],
      } as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ memory }, { status: 201 })
}
