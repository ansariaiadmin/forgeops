import { Activity, HeartPulse } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { FactorStatus, HealthSummary } from '@/lib/api/health'
import { cn } from '@/lib/utils'

const STATUS_TEXT: Record<FactorStatus, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
}

const STATUS_BADGE: Record<FactorStatus, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  critical: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

const STATUS_FILL: Record<FactorStatus, string> = {
  good: 'bg-emerald-500',
  medium: 'bg-amber-500',
  critical: 'bg-red-500',
}

export const HEALTH_LABEL: Record<FactorStatus, string> = {
  good: 'Healthy',
  medium: 'Fair',
  critical: 'Attention',
}

/** Big health score with the factors that drive it. */
export function HealthScorePanel({ summary }: { summary: HealthSummary }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Health Score</CardTitle>
          <CardDescription>Overall project health</CardDescription>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <HeartPulse className="size-4" />
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Big score */}
        <div className="flex flex-col items-center gap-1.5 rounded-xl border bg-muted/30 py-6">
          <p
            className={cn(
              'text-5xl font-bold tabular-nums tracking-tight',
              STATUS_TEXT[summary.status],
            )}
          >
            {summary.score}
          </p>
          <Badge variant="outline" className={cn('font-medium', STATUS_BADGE[summary.status])}>
            {HEALTH_LABEL[summary.status]}
          </Badge>
          <p className="text-xs text-muted-foreground">out of 100 · updated live</p>
        </div>

        {/* Factors */}
        <div className="space-y-3">
          {summary.factors.map((factor) => (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Activity className="size-3" />
                  {factor.label}
                </span>
                <span className="flex items-center gap-2">
                  <span className={cn('font-semibold tabular-nums', STATUS_TEXT[factor.status])}>
                    {factor.display}
                  </span>
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      factor.status === 'good'
                        ? 'bg-emerald-500'
                        : factor.status === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-red-500',
                    )}
                  />
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', STATUS_FILL[factor.status])}
                  style={{ width: `${factor.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
