import { describe, expect, it } from 'vitest'

import { can, minimumRoleFor, type Permission } from '@/lib/permissions'

describe('RBAC permission matrix', () => {
  it('VIEWER is read-only — no mutations', () => {
    expect(can('VIEWER', 'project:create')).toBe(false)
    expect(can('VIEWER', 'project:delete')).toBe(false)
    expect(can('VIEWER', 'service:update')).toBe(false)
    expect(can('VIEWER', 'member:manage')).toBe(false)
  })

  it('DEVELOPER can create/update but not delete projects or manage members', () => {
    expect(can('DEVELOPER', 'project:create')).toBe(true)
    expect(can('DEVELOPER', 'service:create')).toBe(true)
    expect(can('DEVELOPER', 'memory:update')).toBe(true)
    expect(can('DEVELOPER', 'project:delete')).toBe(false)
    expect(can('DEVELOPER', 'member:manage')).toBe(false)
  })

  it('ADMIN and OWNER have every permission', () => {
    const permissions: Permission[] = [
      'project:create',
      'project:delete',
      'member:manage',
      'rag:update',
      'doc:delete',
      'mcp:create',
    ]
    for (const permission of permissions) {
      expect(can('ADMIN', permission)).toBe(true)
      expect(can('OWNER', permission)).toBe(true)
    }
  })

  it('minimumRoleFor returns the lowest role that holds a permission', () => {
    expect(minimumRoleFor('project:create')).toBe('DEVELOPER')
    expect(minimumRoleFor('project:delete')).toBe('ADMIN')
    expect(minimumRoleFor('member:manage')).toBe('ADMIN')
  })
})
