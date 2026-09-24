import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { recordAudit } from '@/lib/audit'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'

/**
 * PATCH  /api/projects/[slug]/docs/[id] — save content (bumps version)
 * DELETE /api/projects/[slug]/docs/[id] — remove a document
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'doc:update')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { content?: unknown } | null
  if (typeof body?.content !== 'string' || body.content.trim().length < 3) {
    return NextResponse.json(
      { error: 'Content must be a string of at least 3 characters.' },
      { status: 400 },
    )
  }

  const document = await prisma.document.update({
    where: { id },
    data: {
      content: body.content,
      version: { increment: 1 },
      lastEditedBy: user.id,
      updatedAt: new Date(),
    },
  })
  await recordAudit({
    userId: user.id,
    projectId: existing.projectId,
    action: 'doc.updated',
    resource: `doc:${existing.path}`,
    details: { version: document.version },
    request,
  })
  return NextResponse.json({ document })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'doc:delete')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.document.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

  await prisma.document.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
