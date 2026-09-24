import { NextResponse } from 'next/server'

import type { SessionUser } from '@/lib/auth'
import { can, type Permission } from '@/lib/permissions'

/**
 * Route guard helper: returns a NextResponse to return directly when the
 * user is missing or lacks the permission, otherwise null (proceed).
 */
export function requirePermission(
  user: SessionUser | null,
  permission: Permission,
): NextResponse | null {
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!can(user.role, permission)) {
    return NextResponse.json(
      { error: 'Forbidden — your role does not allow this action.' },
      { status: 403 },
    )
  }
  return null
}
