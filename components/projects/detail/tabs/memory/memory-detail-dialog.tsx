import { Bot, History, Pin, Plug, type LucideIcon } from 'lucide-react'
import type { MemoryCategory } from '@prisma/client'

import { MarkdownView } from '@/components/projects/detail/tabs/context/file-preview'
import { MemoryCategoryBadge } from '@/components/projects/detail/tabs/memory/memory-badges'
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
import type { MemoryChange, MemoryMetadata } from '@/lib/api/memory'
import { cn } from '@/lib/utils'
import { formatDate, timeAgo } from '@/utils/format'

interface MemoryDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  category: MemoryCategory
  content: string
  meta: MemoryMetadata
  history: MemoryChange[]
  relatedAgents: Array<{ id: string; name: string }>
  relatedMcps: Array<{ id: string; name: string }>
  createdAt: Date
  updatedAt: Date
}

const HISTORY_ICON: Record<MemoryChange['action'], LucideIcon> = {
  created: History,
  updated: History,
  pinned: Pin,
  unpinned: Pin,
}

const HISTORY_COLOR: Record<MemoryChange['action'], string> = {
  created: 'text-sky-600 dark:text-sky-400',
  updated: 'text-amber-600 dark:text-amber-400',
  pinned: 'text-emerald-600 dark:text-emerald-400',
  unpinned: 'text-muted-foreground',
}

/** Full memory detail: rendered markdown, history and related agents/MCPs. */
export function MemoryDetailDialog({
  open,
  onOpenChange,
  title,
  category,
  content,
  meta,
  history,
  relatedAgents,
  relatedMcps,
  createdAt,
  updatedAt,
}: MemoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{title}</DialogTitle>
            <MemoryCategoryBadge category={category} />
            {meta.pinned && (
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400"
              >
                <Pin className="size-3" />
                PINNED
              </Badge>
            )}
          </div>
          <DialogDescription>
            Created {formatDate(createdAt)} · Updated {timeAgo(updatedAt)}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="max-h-72 rounded-md border bg-muted/20 p-4">
          <div className="text-sm">
            <MarkdownView content={content} />
          </div>
        </ScrollArea>

        {/* Tags */}
        {meta.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Tags:</span>
            {meta.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Related */}
        {(relatedAgents.length > 0 || relatedMcps.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {relatedAgents.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Bot className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Agents:</span>
                {relatedAgents.map((agent) => (
                  <Badge key={agent.id} variant="secondary" className="font-medium">
                    {agent.name}
                  </Badge>
                ))}
              </div>
            )}
            {relatedMcps.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Plug className="size-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">MCPs:</span>
                {relatedMcps.map((mcp) => (
                  <Badge key={mcp.id} variant="secondary" className="font-medium">
                    {mcp.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <History className="size-3.5" />
            History
          </p>
          <Separator />
          <div className="space-y-2.5">
            {history.map((change) => {
              const Icon = HISTORY_ICON[change.action]
              return (
                <div key={change.id} className="flex items-start gap-3">
                  <Icon className={cn('mt-0.5 size-3.5 shrink-0', HISTORY_COLOR[change.action])} />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="text-sm font-medium">
                      {change.author} ·{' '}
                      <span className="capitalize text-muted-foreground">{change.action}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{change.summary}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {timeAgo(change.at)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
