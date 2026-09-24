'use client'

import * as React from 'react'
import type { Role } from '@prisma/client'
import { BadgeCheck, Loader2, ShieldCheck, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getInitials, timeAgo } from '@/utils/format'

interface Member {
  id: string
  name: string
  email: string
  role: Role
  isActive: boolean
  lastLogin: Date | null
  createdAt: Date
}

const ROLE_BADGE: Record<Role, string> = {
  OWNER: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  ADMIN: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  DEVELOPER: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  VIEWER: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
}

/** Workspace settings: member management with role changes (ADMIN/OWNER only). */
export function SettingsView() {
  const { data: session } = useSession()
  const [members, setMembers] = React.useState<Member[] | null>(null)
  const [savingId, setSavingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  async function loadMembers() {
    try {
      const response = await fetch('/api/settings/members', { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { members?: Member[] }
      setMembers(data.members ?? [])
    } catch {
      setMembers([])
    }
  }

  React.useEffect(() => {
    void loadMembers()
  }, [])

  async function changeRole(member: Member, role: Role) {
    setError(null)
    setSavingId(member.id)
    const response = await fetch(`/api/settings/members/${member.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    const data = (await response.json().catch(() => null)) as { error?: string } | null
    if (!response.ok) {
      setError(data?.error ?? 'Failed to update role.')
      await loadMembers()
    } else {
      await loadMembers()
    }
    setSavingId(null)
  }

  const canManage = session?.user?.role === 'ADMIN' || session?.user?.role === 'OWNER'

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace members and permissions
        </p>
      </div>

      {/* Workspace summary */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">Main Workspace</CardTitle>
            <CardDescription>
              {members ? `${members.length} members · roles control what each person can do` : 'Loading…'}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" />
            <CardTitle className="text-base">Members</CardTitle>
          </div>
          <CardDescription>
            {canManage
              ? 'You can change roles. OWNER/ADMIN: full access · DEVELOPER: working access · VIEWER: read-only.'
              : 'Your role is read-only for this page.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              {error}
            </p>
          )}

          {!members ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            members.map((member) => {
              const isSelf = member.id === session?.user?.id
              const isLastOwner = member.role === 'OWNER' && members.filter((m) => m.role === 'OWNER').length === 1
              return (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                    {getInitials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {member.name}
                      {isSelf && <BadgeCheck className="size-3.5 text-sky-500" />}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.email} ·{' '}
                      {member.lastLogin ? `active ${timeAgo(member.lastLogin)}` : 'never logged in'}
                    </p>
                  </div>

                  <Badge variant="outline" className={ROLE_BADGE[member.role]}>
                    {member.role}
                  </Badge>

                  {canManage && (
                    <div className="flex items-center gap-2">
                      {savingId === member.id && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                      <Select
                        value={member.role}
                        onValueChange={(value) => changeRole(member, value as Role)}
                        disabled={savingId !== null || isLastOwner}
                      >
                        <SelectTrigger className="h-8 w-36" aria-label={`Role for ${member.name}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OWNER">OWNER</SelectItem>
                          <SelectItem value="ADMIN">ADMIN</SelectItem>
                          <SelectItem value="DEVELOPER">DEVELOPER</SelectItem>
                          <SelectItem value="VIEWER">VIEWER</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {!canManage && (
            <p className="pt-1 text-xs text-muted-foreground">
              Only ADMIN and OWNER roles can change member permissions.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
