import type { MemoryCategory } from '@prisma/client'
import { Bug, ClipboardList, Landmark, Lightbulb, ListChecks, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface MemoryCategoryMeta {
  label: string
  short: string
  icon: LucideIcon
  badgeClass: string
  chipClass: string
}

export const MEMORY_CATEGORIES: MemoryCategory[] = [
  'ARCHITECTURE',
  'DECISION',
  'BUG',
  'CONVENTION',
  'TODO',
]

export const MEMORY_CATEGORY_META: Record<MemoryCategory, MemoryCategoryMeta> = {
  ARCHITECTURE: {
    label: 'Architecture',
    short: 'Arch',
    icon: Landmark,
    badgeClass: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
    chipClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  DECISION: {
    label: 'Decisions',
    short: 'Dec',
    icon: Lightbulb,
    badgeClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    chipClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  BUG: {
    label: 'Known Bugs',
    short: 'Bug',
    icon: Bug,
    badgeClass: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
    chipClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
  },
  CONVENTION: {
    label: 'Conventions',
    short: 'Conv',
    icon: ClipboardList,
    badgeClass: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
    chipClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  },
  TODO: {
    label: 'TODO',
    short: 'Todo',
    icon: ListChecks,
    badgeClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    chipClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
}

/** Colored category badge used in lists and dialogs. */
export function MemoryCategoryBadge({ category }: { category: MemoryCategory }) {
  const meta = MEMORY_CATEGORY_META[category]
  return (
    <Badge variant="outline" className={cn('font-medium', meta.badgeClass)}>
      {meta.label}
    </Badge>
  )
}

/** Compact category chip for the filter bar. */
export function MemoryCategoryChip({
  category,
  active,
  count,
  onClick,
}: {
  category: MemoryCategory
  active: boolean
  count: number
  onClick: () => void
}) {
  const meta = MEMORY_CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="size-3.5" />
      {meta.label}
      <span
        className={cn(
          'rounded-full px-1.5 text-[10px] tabular-nums',
          active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground',
        )}
      >
        {count}
      </span>
    </button>
  )
}
