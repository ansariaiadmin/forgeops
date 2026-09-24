import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { memoryFormSchema } from '@/lib/validations/memory'

/**
 * PATCH  /api/projects/[slug]/memory/[id] — update content/category/title
 * POST   /api/projects/[slug]/memory/[id]  — { action: "pin" | "unpin" | "delete" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'memory:update')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.projectMemory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Memory not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = memoryFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const memory = await prisma.projectMemory.update({
    where: { id },
    data: {
      title: parsed.data.title,
      category: parsed.data.category,
      content: parsed.data.content,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json({ memory })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'memory:create')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.projectMemory.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Memory not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action

  if (action === 'delete') {
    await prisma.projectMemory.delete({ where: { id } })
    await recordAudit({
      userId: user.id,
      projectId: existing.projectId,
      action: 'memory.deleted',
      resource: `memory:${existing.title}`,
      request,
    })
    return NextResponse.json({ success: true })
  }

  if (action === 'pin' || action === 'unpin') {
    const meta = (existing.metadata ?? {}) as Record<string, unknown>
    const memory = await prisma.projectMemory.update({
      where: { id },
      data: {
        metadata: { ...meta, pinned: action === 'pin' } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ memory })
  }

  return NextResponse.json(
    { error: 'Invalid action — use "pin", "unpin" or "delete".' },
    { status: 400 },
  )
}
