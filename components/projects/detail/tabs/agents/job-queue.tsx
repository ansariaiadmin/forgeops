import { ListOrdered } from 'lucide-react'

import { AGENT_TYPE_ICON } from '@/components/projects/detail/tabs/agents/agent-badges'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { AgentJobView } from '@/lib/api/agents'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

const STATUS_CLASS: Record<AgentJobView['status'], string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  RUNNING: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  SUCCESS: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  FAILED: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

/** Job queue: pending/running/failed jobs of the project. */
export function JobQueue({ jobs }: { jobs: AgentJobView[] }) {
  const queued = jobs.filter((job) => job.status === 'PENDING' || job.status === 'RUNNING')
  const recent = jobs.slice(0, 6)

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <ListOrdered className="size-3.5" />
        Job Queue · {queued.length} active
      </p>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="px-4 py-6 text-center text-sm text-muted-foreground">
            No jobs yet — create one with “New Job”.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recent.map((job) => {
            const TypeIcon = AGENT_TYPE_ICON[job.agentType]
            return (
              <Card key={job.id} className="py-0">
                <CardContent className="flex items-center gap-3 px-4 py-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <TypeIcon className="size-3.5" />
                  </div>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-sm font-medium">{job.task}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {job.agentName} · {job.startedAt ? timeAgo(job.startedAt) : 'queued'}
                      {job.error ? ` · ${job.error}` : ''}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn('shrink-0 font-mono text-[10px]', STATUS_CLASS[job.status])}
                  >
                    {job.status}
                  </Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
