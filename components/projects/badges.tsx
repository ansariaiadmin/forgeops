import type { Environment, ProjectStatus } from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import { getHealthLevel, HEALTH_LABEL, type HealthLevel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export const STATUS_BADGE: Record<ProjectStatus, string> = {
  ACTIVE: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ARCHIVED: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
  DELETED: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export const ENV_BADGE: Record<Environment, string> = {
  DEV: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  STAGING: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  PROD: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
}

export const HEALTH_TEXT: Record<HealthLevel, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
}

export const HEALTH_FILL: Record<HealthLevel, string> = {
  good: 'bg-emerald-500',
  medium: 'bg-amber-500',
  critical: 'bg-red-500',
}

export const HEALTH_DOT: Record<HealthLevel, string> = {
  good: 'bg-emerald-500',
  medium: 'bg-amber-500',
  critical: 'bg-red-500',
}

/** Colored status badge (Active / Archived / Deleted). */
export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', STATUS_BADGE[status])}>
      {status}
    </Badge>
  )
}

/** Colored environment badge (Dev / Staging / Prod). */
export function ProjectEnvironmentBadge({ environment }: { environment: Environment }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', ENV_BADGE[environment])}>
      {environment}
    </Badge>
  )
}

/** Health score with color-coded dot + label. */
export function HealthScoreBadge({ score }: { score: number }) {
  const level = getHealthLevel(score)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold tabular-nums',
        HEALTH_TEXT[level],
        'border-current/20 bg-background',
      )}
    >
      <span className={cn('size-1.5 rounded-full', HEALTH_DOT[level])} />
      {score}
      <span className="font-normal opacity-70">/100 · {HEALTH_LABEL[level]}</span>
    </span>
  )
}
