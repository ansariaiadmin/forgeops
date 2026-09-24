'use client'

import * as React from 'react'
import type { Agent } from '@prisma/client'
import { Activity, Coins, History, Terminal } from 'lucide-react'

import {
  AgentStatusBadge,
  AgentTypeBadge,
  AGENT_TYPE_ICON,
  AGENT_TYPE_ICON_CLASS,
} from '@/components/projects/detail/tabs/agents/agent-badges'
import { UsageChart } from '@/components/projects/detail/tabs/agents/usage-chart'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAgentUsage, getProjectJobs, type AgentUsage, type AgentJobView } from '@/lib/api/agents'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

interface AgentDetailDialogProps {
  agent: Agent | null
  onOpenChange: (open: boolean) => void
}

/** Full agent details: prompt, consumption chart, stats and job history. */
export function AgentDetailDialog({ agent, onOpenChange }: AgentDetailDialogProps) {
  const [usage, setUsage] = React.useState<AgentUsage | null>(null)
  const [jobs, setJobs] = React.useState<AgentJobView[] | null>(null)

  React.useEffect(() => {
    if (!agent) return
    let cancelled = false
    Promise.all([
      getAgentUsage(agent),
      Promise.resolve(
        getProjectJobs(agent.projectId ?? 'proj-core').filter((job) => job.agentId === agent.id),
      ),
    ]).then(([usageData, jobData]) => {
      if (cancelled) return
      setUsage(usageData)
      setJobs(jobData)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent?.id])

  if (!agent) return null

  const TypeIcon = AGENT_TYPE_ICON[agent.type] ?? AGENT_TYPE_ICON.DEVELOPER
  const tools = Array.isArray(agent.tools) ? (agent.tools as string[]) : []

  return (
    <Dialog open={!!agent} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <div
              className={cn(
                'flex size-9 items-center justify-center rounded-lg',
                AGENT_TYPE_ICON_CLASS[agent.type],
              )}
            >
              <TypeIcon className="size-4" />
            </div>
            <DialogTitle>{agent.name}</DialogTitle>
            <AgentTypeBadge type={agent.type} />
            <AgentStatusBadge status={agent.status} />
            <span className="font-mono text-xs text-muted-foreground">{agent.model}</span>
          </div>
          <DialogDescription>
            Created {timeAgo(agent.createdAt)} · {tools.length} tools ·{' '}
            {(agent.mcpIds as string[] | null)?.length ?? 0} MCPs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* System prompt */}
          <div className="space-y-1.5">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Terminal className="size-3.5" />
              System prompt
            </p>
            <p className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-foreground/90">
              {agent.systemPrompt}
            </p>
          </div>

          {/* Usage */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3.5" />
              Consumption · last 14 days
            </p>
            {usage ? <UsageChart data={usage.daily} /> : <Skeleton className="h-44 w-full" />}
          </div>

          {/* Totals */}
          {usage && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <Coins className="size-4 shrink-0 text-sky-500" />
                <div className="leading-tight">
                  <p className="text-lg font-bold tabular-nums">
                    {usage.totalTokens.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">Total tokens</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <Coins className="size-4 shrink-0 text-emerald-500" />
                <div className="leading-tight">
                  <p className="text-lg font-bold tabular-nums">${usage.totalCost.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">Total cost</p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Job history */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <History className="size-3.5" />
              Job history
            </p>
            {jobs ? (
              jobs.length > 0 ? (
                <ScrollArea className="max-h-64 rounded-md border">
                  <div className="divide-y">
                    {jobs.map((job) => (
                      <div key={job.id} className="px-3 py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-sm font-medium">{job.task}</p>
                          <Badge
                            variant="outline"
                            className={cn(
                              'shrink-0 font-mono text-[10px]',
                              job.status === 'SUCCESS'
                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : job.status === 'FAILED'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400'
                                  : job.status === 'RUNNING'
                                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
                            )}
                          >
                            {job.status}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {job.startedAt ? timeAgo(job.startedAt) : '—'} ·{' '}
                          {job.tokensUsed.toLocaleString()} tokens · ${job.cost.toFixed(2)}
                          {job.error ? ` · ${job.error}` : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No jobs yet — run one with “New Job”.
                </p>
              )
            ) : (
              <Skeleton className="h-32 w-full" />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
