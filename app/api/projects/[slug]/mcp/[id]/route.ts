import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'

/**
 * PATCH /api/projects/[slug]/mcp/[id] — edit a connection
 * POST  /api/projects/[slug]/mcp/[id] — { action: "connect" | "disconnect" | "delete" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'mcp:update')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.mCPConnection.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const name = typeof body?.name === 'string' ? body.name.trim() : null
  if (!name || name.length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
  }

  const connection = await prisma.mCPConnection.update({
    where: { id },
    data: { name, updatedAt: new Date() },
  })
  return NextResponse.json({ connection })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'mcp:create')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.mCPConnection.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Connection not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action

  if (action === 'delete') {
    await prisma.mCPConnection.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }

  if (action === 'connect' || action === 'disconnect') {
    const connection = await prisma.mCPConnection.update({
      where: { id },
      data: {
        status: action === 'connect' ? 'CONNECTED' : 'DISCONNECTED',
        lastConnectedAt: action === 'connect' ? new Date() : existing.lastConnectedAt,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ connection })
  }

  return NextResponse.json(
    { error: 'Invalid action — use "connect", "disconnect" or "delete".' },
    { status: 400 },
  )
}
