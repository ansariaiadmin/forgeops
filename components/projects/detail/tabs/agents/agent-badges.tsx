import type { AgentStatus, AgentType, JobStatus } from '@prisma/client'
import {
  Bot,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  Code2,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { AGENT_STATUS_LABEL, JOB_STATUS_LABEL } from '@/lib/api/agents'
import { cn } from '@/lib/utils'

export const AGENT_TYPE_ICON: Record<AgentType, LucideIcon> = {
  DEVELOPER: Code2,
  DEVOPS: Rocket,
  REVIEWER: ClipboardCheck,
  DOCUMENTER: BookOpen,
  PRODUCT: Briefcase,
}

export const AGENT_TYPE_ICON_CLASS: Record<AgentType, string> = {
  DEVELOPER: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  DEVOPS: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  REVIEWER: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  DOCUMENTER: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PRODUCT: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export const AGENT_TYPE_BADGE: Record<AgentType, string> = {
  DEVELOPER: 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400',
  DEVOPS: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  REVIEWER: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  DOCUMENTER: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  PRODUCT: 'border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400',
}

export const AGENT_STATUS_BADGE: Record<AgentStatus, string> = {
  IDLE: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
  RUNNING: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  ERROR: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export const JOB_STATUS_BADGE: Record<JobStatus, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  RUNNING: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  SUCCESS: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  FAILED: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

/** Colored agent status badge (Idle / Running / Error). */
export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', AGENT_STATUS_BADGE[status])}>
      {AGENT_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Colored agent type badge (Developer / DevOps / ...). */
export function AgentTypeBadge({ type }: { type: AgentType }) {
  return (
    <Badge variant="outline" className={cn('font-medium', AGENT_TYPE_BADGE[type])}>
      {type}
    </Badge>
  )
}

/** Colored job status badge. */
export function JobStatusBadge({ status }: { status: JobStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', JOB_STATUS_BADGE[status])}>
      {JOB_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Generic fallback icon for unknown types. */
export const AgentFallbackIcon = Bot
