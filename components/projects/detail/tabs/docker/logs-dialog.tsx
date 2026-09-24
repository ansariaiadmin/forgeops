'use client'

import { ScrollText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface LogsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceName: string | null
  logs: string[]
  loading: boolean
  onRefresh: () => void
}

/** Full log viewer for a service (dialog). */
export function LogsDialog({
  open,
  onOpenChange,
  serviceName,
  logs,
  loading,
  onRefresh,
}: LogsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScrollText className="size-4" />
            Logs — {serviceName ?? 'service'}
          </DialogTitle>
          <DialogDescription>Last 50 lines · updates on refresh</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{logs.length} lines loaded</span>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <ScrollArea className="h-96 rounded-md border bg-muted/30 p-3">
          {logs.length > 0 ? (
            <div className="space-y-0.5">
              {logs.map((line, index) => {
                const level = line.includes(' ERROR ')
                  ? 'text-red-500'
                  : line.includes(' WARN ')
                    ? 'text-amber-500'
                    : 'text-muted-foreground'
                return (
                  <div
                    key={index}
                    className={cn(
                      'whitespace-pre-wrap break-all font-mono text-[11px] leading-5',
                      level,
                    )}
                  >
                    {line}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {loading ? 'Loading logs...' : 'No logs available.'}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
