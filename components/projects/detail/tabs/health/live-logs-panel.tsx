'use client'

import * as React from 'react'
import { Download, Loader2, Pause, Play, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getInitialLogs, type LogEntry, type LogLevel } from '@/lib/api/health'
import { useEventStream } from '@/hooks/use-event-stream'
import { cn } from '@/lib/utils'

const SERVICE_OPTIONS = ['All services', 'web', 'api', 'worker', 'db', 'backup-runner']
const LEVEL_STYLE: Record<LogLevel, string> = {
  INFO: 'text-muted-foreground',
  WARN: 'text-amber-500',
  ERROR: 'text-red-500',
}

interface LiveLogsPanelProps {
  /** Project slug for the SSE stream endpoint. */
  slug: string
  /** When set, the viewer starts filtered to this service. */
  focusService?: string | null
}

function formatTime(date: Date): string {
  return date.toISOString().slice(11, 23)
}

/**
 * Live log viewer: level/service filters, pause/clear/download, live stream
 * and error lines highlighted in red. Lightweight custom implementation
 * (PatternFly's viewer pulled ~100 deps and exceeded the sandbox memory).
 */
export function LiveLogsPanel({ slug, focusService }: LiveLogsPanelProps) {
  const [lines, setLines] = React.useState<LogEntry[]>(() => getInitialLogs())
  const [paused, setPaused] = React.useState(false)
  const [level, setLevel] = React.useState<'ALL' | LogLevel>('ALL')
  const [service, setService] = React.useState<string>(
    focusService && focusService !== 'All services' ? focusService : 'All services',
  )
  const viewportRef = React.useRef<HTMLDivElement>(null)

  // Keep the service filter in sync when opened from a service card.
  React.useEffect(() => {
    if (focusService && focusService !== 'All services') {
      setService(focusService)
    }
  }, [focusService])

  // Live stream via SSE (server-sent events) with auto-reconnect.
  const streamUrl = `/api/projects/${slug}/live/logs`
  const { connected, error: streamError } = useEventStream(
    paused ? null : streamUrl,
    (data) => {
      try {
        const entry = JSON.parse(data) as LogEntry
        if (entry && entry.message) {
          setLines((prev) => [...prev.slice(-399), entry])
        }
      } catch {
        /* ignore malformed frames */
      }
    },
    !paused,
  )

  // Auto-scroll to the newest line.
  React.useEffect(() => {
    const viewport = viewportRef.current
    if (viewport) viewport.scrollTop = viewport.scrollHeight
  }, [lines.length])

  const filtered = React.useMemo(() => {
    return lines.filter((entry) => {
      if (level !== 'ALL' && entry.level !== level) return false
      if (service !== 'All services' && entry.service !== service) return false
      return true
    })
  }, [lines, level, service])

  function handleDownload() {
    const text = filtered
      .map((entry) => `${entry.at.toISOString()} ${entry.level} ${entry.service} ${entry.message}`)
      .join('\n')
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = `forge-core-logs-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.log`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
        <div>
          <CardTitle className="text-base">Live Logs</CardTitle>
          <CardDescription>
            Streaming from all services
            {paused ? ' · paused' : connected ? ' · live' : ' · reconnecting…'}
            {streamError && <span className="text-amber-500"> ⚠</span>}
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={level} onValueChange={(value) => setLevel(value as 'ALL' | LogLevel)}>
            <SelectTrigger className="h-8 w-32" aria-label="Filter by level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All levels</SelectItem>
              <SelectItem value="INFO">Info</SelectItem>
              <SelectItem value="WARN">Warning</SelectItem>
              <SelectItem value="ERROR">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="h-8 w-40" aria-label="Filter by service">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setPaused((prev) => !prev)}
            aria-label={paused ? 'Resume logs' : 'Pause logs'}
          >
            {paused ? <Play /> : <Pause />}
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => setLines([])}>
            <Trash2 />
            Clear
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handleDownload}>
            <Download />
            Download
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="h-80 rounded-md border bg-muted/20">
          <div ref={viewportRef} className="min-h-full px-3 py-2">
            {filtered.length === 0 ? (
              <div className="flex h-72 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {level !== 'ALL' || service !== 'All services'
                  ? 'No log lines match the current filters.'
                  : 'Log buffer cleared — waiting for new lines…'}
              </div>
            ) : (
              <div className="space-y-0.5 font-mono text-[11px] leading-5">
                {filtered.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'flex gap-3 whitespace-pre-wrap break-all',
                      LEVEL_STYLE[entry.level],
                    )}
                  >
                    <span className="shrink-0 select-none text-muted-foreground/50">
                      {formatTime(entry.at)}
                    </span>
                    <span className="w-12 shrink-0 font-semibold">{entry.level.padEnd(5)}</span>
                    <span className="w-24 shrink-0 text-muted-foreground/70">{entry.service}</span>
                    <span className="min-w-0">{entry.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
