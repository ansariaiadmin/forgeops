import { NextResponse } from 'next/server'
import type { Role } from '@prisma/client'

import { recordAudit } from '@/lib/audit'
import { getSessionUser } from '@/lib/auth'
import { can, type Permission } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'

const VALID_ROLES: Role[] = ['OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER']

/**
 * PATCH /api/settings/members/[id] — change a member's role
 * Body: { role: Role }
 * Only ADMIN/OWNER may do this; an OWNER can never be demoted (safety).
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.role, 'member:manage' as Permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = (await request.json().catch(() => null)) as { role?: string } | null
  const role = body?.role as Role | undefined

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  // Safety: the last OWNER cannot be demoted.
  if (target.role === 'OWNER' && role !== 'OWNER') {
    const owners = await prisma.user.count({ where: { role: 'OWNER' } })
    if (owners <= 1) {
      return NextResponse.json(
        { error: 'Cannot demote the last OWNER of the workspace.' },
        { status: 400 },
      )
    }
  }

  const member = await prisma.user.update({
    where: { id },
    data: { role, updatedAt: new Date() },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  })

  await recordAudit({
    userId: user.id,
    action: 'member.role_changed',
    resource: `user:${target.email}`,
    details: { from: target.role, to: role },
    request,
  })

  return NextResponse.json({ member })
}
