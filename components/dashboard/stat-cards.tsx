'use client'

import * as React from 'react'
import { Bot, Container, FolderKanban, Gauge } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getHealthLevel, HEALTH_LABEL, type HealthLevel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const LEVEL_TEXT: Record<HealthLevel, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
}

const LEVEL_DOT: Record<HealthLevel, string> = {
  good: 'bg-emerald-500',
  medium: 'bg-amber-500',
  critical: 'bg-red-500',
}

interface DashboardStats {
  totalProjects: number
  runningServices: number
  totalServices: number
  activeAgents: number
  avgHealthScore: number
  jobsSucceededToday: number
  jobsFailedToday: number
}

/**
 * Row of four statistics cards fed by GET /api/dashboard/stats.
 * Renders skeletons until the real numbers arrive.
 */
export function StatCards() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null)

  React.useEffect(() => {
    let cancelled = false

    fetch('/api/dashboard/stats', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { stats?: DashboardStats } | null) => {
        if (cancelled || !data?.stats) return
        setStats(data.stats)
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [])

  if (!stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  const healthLevel = getHealthLevel(stats.avgHealthScore)

  const cards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      hint: `${stats.totalProjects} total`,
      hintClass: 'text-muted-foreground',
      icon: FolderKanban,
      iconClass: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Running Services',
      value: stats.runningServices,
      hint: `${stats.totalServices} total · ${stats.totalServices - stats.runningServices} stopped`,
      hintClass: 'text-muted-foreground',
      icon: Container,
      iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Active Agents',
      value: stats.activeAgents,
      hint: 'running now',
      hintClass: 'text-muted-foreground',
      icon: Bot,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Health Score',
      value: stats.avgHealthScore,
      hint: `${HEALTH_LABEL[healthLevel]} · ${stats.jobsFailedToday} failed jobs today`,
      hintClass: 'text-muted-foreground',
      icon: Gauge,
      iconClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      valueClass: LEVEL_TEXT[healthLevel],
      dotClass: LEVEL_DOT[healthLevel],
    },
  ] as const

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div
                className={cn('flex size-8 items-center justify-center rounded-lg', card.iconClass)}
              >
                <Icon className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-2xl font-bold tabular-nums tracking-tight',
                    'valueClass' in card && card.valueClass,
                  )}
                >
                  {card.value}
                </span>
                {'dotClass' in card && (
                  <span className={cn('size-2 rounded-full', card.dotClass)} />
                )}
              </div>
              <p className={cn('mt-1 text-xs', card.hintClass)}>{card.hint}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
