import type { Role } from '@prisma/client'

/** Named permissions used by API route guards. */
export type Permission =
  | 'project:create'
  | 'project:update'
  | 'project:delete'
  | 'service:create'
  | 'service:update'
  | 'service:delete'
  | 'agent:create'
  | 'agent:update'
  | 'agent:delete'
  | 'memory:create'
  | 'memory:update'
  | 'memory:delete'
  | 'mcp:create'
  | 'mcp:update'
  | 'mcp:delete'
  | 'doc:create'
  | 'doc:update'
  | 'doc:delete'
  | 'rag:create'
  | 'rag:update'
  | 'rag:delete'
  | 'member:manage'

const ALL_PERMISSIONS: Permission[] = [
  'project:create',
  'project:update',
  'project:delete',
  'service:create',
  'service:update',
  'service:delete',
  'agent:create',
  'agent:update',
  'agent:delete',
  'memory:create',
  'memory:update',
  'memory:delete',
  'mcp:create',
  'mcp:update',
  'mcp:delete',
  'doc:create',
  'doc:update',
  'doc:delete',
  'rag:create',
  'rag:update',
  'rag:delete',
  'member:manage',
]

/**
 * Role → permission matrix (RBAC).
 * VIEWER  — read-only
 * DEVELOPER — full working rights (no project delete, no member management)
 * ADMIN   — everything
 * OWNER   — everything
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: [],
  DEVELOPER: ALL_PERMISSIONS.filter(
    (permission) => !['project:delete', 'member:manage'].includes(permission),
  ),
  ADMIN: ALL_PERMISSIONS,
  OWNER: ALL_PERMISSIONS,
}

/** Whether a role may perform a given permission. */
export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

/** Highest role that holds a permission (for hints/UI). */
export function minimumRoleFor(permission: Permission): Role {
  if (ROLE_PERMISSIONS.VIEWER.includes(permission)) return 'VIEWER'
  if (ROLE_PERMISSIONS.DEVELOPER.includes(permission)) return 'DEVELOPER'
  return 'ADMIN'
}
