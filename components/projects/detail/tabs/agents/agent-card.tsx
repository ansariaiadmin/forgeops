import type { Agent } from '@prisma/client'
import { Braces, History, Pencil, Play, Trash2 } from 'lucide-react'

import {
  AgentStatusBadge,
  AgentTypeBadge,
  AGENT_TYPE_ICON,
  AGENT_TYPE_ICON_CLASS,
} from '@/components/projects/detail/tabs/agents/agent-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AgentCardProps {
  agent: Agent
  todayJobs: number
  todayTokens: number
  busy: boolean
  onRun: () => void
  onEdit: () => void
  onDelete: () => void
  onViewJobs: () => void
}

/** Single agent card in the grid: identity, status, stats and actions. */
export function AgentCard({
  agent,
  todayJobs,
  todayTokens,
  busy,
  onRun,
  onEdit,
  onDelete,
  onViewJobs,
}: AgentCardProps) {
  const TypeIcon = AGENT_TYPE_ICON[agent.type] ?? AGENT_TYPE_ICON.DEVELOPER

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-1 flex-col gap-4 p-4">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              AGENT_TYPE_ICON_CLASS[agent.type],
            )}
          >
            <TypeIcon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-snug">{agent.name}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <AgentTypeBadge type={agent.type} />
              <span className="font-mono text-[11px] text-muted-foreground">{agent.model}</span>
            </div>
          </div>
          <AgentStatusBadge status={agent.status} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border px-3 py-2 leading-tight">
            <p className="text-base font-bold tabular-nums">{todayJobs}</p>
            <p className="text-[11px] text-muted-foreground">Jobs today</p>
          </div>
          <div className="rounded-lg border px-3 py-2 leading-tight">
            <p className="text-base font-bold tabular-nums">{todayTokens.toLocaleString()}</p>
            <p className="text-[11px] text-muted-foreground">Tokens today</p>
          </div>
        </div>

        {/* Tools hint */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Braces className="size-3.5 shrink-0" />
          <span className="truncate">
            {(Array.isArray(agent.tools) ? (agent.tools as string[]) : []).join(', ') || 'No tools'}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-0.5 border-t pt-3">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={busy} onClick={onRun}>
            <Play className="size-3.5" />
            Run
          </Button>
          <Button variant="ghost" size="sm" onClick={onViewJobs}>
            <History className="size-3.5" />
            Jobs
          </Button>
          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={onEdit}
              aria-label={`Edit ${agent.name}`}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              aria-label={`Delete ${agent.name}`}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
