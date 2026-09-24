import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can, type Permission } from '@/lib/permissions'

/**
 * GET /api/settings/members — list workspace members (users) with roles.
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.role, 'member:manage' as Permission)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const members = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ members })
}
