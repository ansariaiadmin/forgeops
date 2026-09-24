import {
  Activity,
  Bot,
  DatabaseBackup,
  FolderPlus,
  KeyRound,
  ListChecks,
  Plug,
  Rocket,
  type LucideIcon,
} from 'lucide-react'

import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { mockAuditLogs, mockProjects, mockUserName } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

interface ActivityMeta {
  icon: LucideIcon
  tint: string
}

function activityMeta(action: string): ActivityMeta {
  if (action.startsWith('deploy'))
    return { icon: Rocket, tint: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' }
  if (action.startsWith('project'))
    return { icon: FolderPlus, tint: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' }
  if (action.startsWith('agent'))
    return { icon: Bot, tint: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' }
  if (action.startsWith('mcp'))
    return { icon: Plug, tint: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' }
  if (action.startsWith('auth'))
    return { icon: KeyRound, tint: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' }
  if (action.startsWith('backup'))
    return { icon: DatabaseBackup, tint: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' }
  if (action.startsWith('task'))
    return { icon: ListChecks, tint: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' }
  return { icon: Activity, tint: 'bg-muted text-muted-foreground' }
}

function humanize(action: string): string {
  return action
    .split('.')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' · ')
}

function projectName(projectId: string | null): string {
  if (!projectId) return 'Workspace'
  return mockProjects.find((p) => p.id === projectId)?.name ?? 'Unknown project'
}

/**
 * Feed of the 10 most recent audit log events:
 * icon, action, project, user and relative time.
 */
export function RecentActivity() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <CardDescription>Latest events across your workspace</CardDescription>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          View all
        </Button>
      </CardHeader>

      <ScrollArea className="h-[430px]">
        <div className="divide-y px-6 pb-2">
          {mockAuditLogs.slice(0, 10).map((log) => {
            const { icon: Icon, tint } = activityMeta(log.action)
            return (
              <div key={log.id} className="flex items-center gap-3 py-3">
                <div
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    tint,
                  )}
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{humanize(log.action)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {projectName(log.projectId)}
                    </span>
                    {' · '}
                    {mockUserName(log.userId)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(log.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </Card>
  )
}
