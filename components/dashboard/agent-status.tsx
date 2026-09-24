import { Bot, CheckCircle2, XCircle } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getDashboardStats, mockAgents, mockJobs } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

/**
 * Agent panel: running agents, the latest job and today's success/failure counts.
 */
export function AgentStatus() {
  const stats = getDashboardStats()
  const runningAgents = mockAgents.filter((a) => a.status === 'RUNNING')

  const latestJob = [...mockJobs].sort(
    (a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0),
  )[0]
  const latestAgent = mockAgents.find((a) => a.id === latestJob?.agentId)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Agent Status</CardTitle>
          <CardDescription>Running agents and job activity</CardDescription>
        </div>
        <Badge variant="secondary" className="font-mono">
          {stats.activeAgents} running
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Running agents */}
        <div className="space-y-2">
          {runningAgents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
              <div className="relative">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{agent.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {agent.type} · {agent.model}
                </p>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                RUNNING
              </Badge>
            </div>
          ))}
        </div>

        <Separator />

        {/* Latest job */}
        {latestJob && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Latest job
            </p>
            <div className="flex items-start gap-3 rounded-lg bg-muted/50 px-3 py-2.5">
              <div
                className={cn(
                  'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md',
                  latestJob.status === 'SUCCESS'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-500/10 text-red-600 dark:text-red-400',
                )}
              >
                {latestJob.status === 'SUCCESS' ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <XCircle className="size-4" />
                )}
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-medium">{latestJob.task}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {latestAgent?.name ?? 'Agent'} ·{' '}
                  {latestJob.completedAt ? timeAgo(latestJob.completedAt) : '—'}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 font-mono text-[10px]',
                  latestJob.status === 'SUCCESS'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
                )}
              >
                {latestJob.status}
              </Badge>
            </div>
          </div>
        )}

        <Separator />

        {/* Today's jobs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
            <div className="leading-tight">
              <p className="text-lg font-bold tabular-nums">{stats.jobsSucceededToday}</p>
              <p className="text-xs text-muted-foreground">Succeeded today</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
            <XCircle className="size-4 shrink-0 text-red-500" />
            <div className="leading-tight">
              <p className="text-lg font-bold tabular-nums">{stats.jobsFailedToday}</p>
              <p className="text-xs text-muted-foreground">Failed today</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
