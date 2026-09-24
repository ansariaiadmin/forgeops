import type { MCPConnection } from '@prisma/client'
import { Box, Briefcase, Database, Folder, Github, Plug, Puzzle, Slack } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { MCP_TYPE_LABEL, type McpType } from '@/lib/api/mcp'
import { cn } from '@/lib/utils'

export type McpStatus = MCPConnection['status']

export const MCP_STATUS_BADGE: Record<McpStatus, string> = {
  CONNECTED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  DISCONNECTED: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
  ERROR: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export const MCP_STATUS_LABEL: Record<McpStatus, string> = {
  CONNECTED: 'Connected',
  DISCONNECTED: 'Disconnected',
  ERROR: 'Error',
}

const TYPE_ICON: Record<McpType, typeof Plug> = {
  github: Github,
  slack: Slack,
  jira: Briefcase,
  postgres: Database,
  redis: Database,
  filesystem: Folder,
  kubernetes: Box,
  custom: Puzzle,
}

/** Colored status badge (Connected / Disconnected / Error). */
export function McpStatusBadge({ status }: { status: McpStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', MCP_STATUS_BADGE[status])}>
      {MCP_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Connection type badge with icon (GitHub / Slack / Jira / ...). */
export function McpTypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type as McpType] ?? Plug
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      <Icon className="size-3" />
      {MCP_TYPE_LABEL[type as McpType] ?? type}
    </Badge>
  )
}
