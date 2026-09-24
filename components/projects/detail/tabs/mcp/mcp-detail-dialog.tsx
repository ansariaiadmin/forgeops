'use client'

import * as React from 'react'
import ReactJson from '@microlink/react-json-view'
import type { MCPConnection } from '@prisma/client'
import { Activity, CheckCircle2, Loader2, Plug, XCircle } from 'lucide-react'

import { McpStatusBadge, McpTypeBadge } from '@/components/projects/detail/tabs/mcp/mcp-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  getMcpLogs,
  getMcpUsage,
  testMcpConnection,
  type McpLogEntry,
  type McpTestResult,
  type McpUsage,
} from '@/lib/api/mcp'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

interface McpDetailDialogProps {
  connection: MCPConnection | null
  onOpenChange: (open: boolean) => void
  onTestResult?: (result: McpTestResult) => void
}

/** Full connection details: config, logs, usage stats and active tools. */
export function McpDetailDialog({ connection, onOpenChange, onTestResult }: McpDetailDialogProps) {
  const [logs, setLogs] = React.useState<McpLogEntry[]>([])
  const [usage, setUsage] = React.useState<McpUsage | null>(null)
  const [testing, setTesting] = React.useState(false)
  const [testResult, setTestResult] = React.useState<McpTestResult | null>(null)

  // Load logs + usage when a connection is opened.
  React.useEffect(() => {
    if (!connection) return
    let cancelled = false
    Promise.all([getMcpLogs(connection.id), getMcpUsage(connection.id)]).then(
      ([logEntries, usageStats]) => {
        if (cancelled) return
        setLogs(logEntries)
        setUsage(usageStats)
        setTestResult(null)
      },
    )
    return () => {
      cancelled = true
    }
  }, [connection?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleTest() {
    if (!connection) return
    setTesting(true)
    const result = await testMcpConnection(connection)
    setTesting(false)
    setTestResult(result)
    onTestResult?.(result)
  }

  if (!connection) return null

  const tools = Array.isArray(connection.allowedTools) ? (connection.allowedTools as string[]) : []
  const scopes = Array.isArray(connection.scopes) ? (connection.scopes as string[]) : []
  const config = (connection.config ?? {}) as Record<string, unknown>

  return (
    <Dialog open={!!connection} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{connection.name}</DialogTitle>
            <McpTypeBadge type={connection.type} />
            <McpStatusBadge status={connection.status} />
          </div>
          <DialogDescription>
            {connection.lastConnectedAt
              ? `Last connected ${timeAgo(connection.lastConnectedAt)}`
              : 'Never connected'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Test connection */}
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="animate-spin" /> : <Plug />}
              Test Connection
            </Button>
            {testResult && (
              <span
                className={cn(
                  'flex items-center gap-1.5 text-xs font-medium',
                  testResult.ok
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400',
                )}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="size-3.5" />
                ) : (
                  <XCircle className="size-3.5" />
                )}
                {testResult.message}
              </span>
            )}
          </div>

          {/* Usage stats */}
          {usage && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Requests today', value: usage.requestsToday.toLocaleString() },
                { label: 'Tokens today', value: usage.tokensToday.toLocaleString() },
                {
                  label: 'Errors today',
                  value: String(usage.errorsToday),
                  danger: usage.errorsToday > 0,
                },
                { label: 'Avg latency', value: `${usage.avgLatencyMs} ms` },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border px-3 py-2 leading-tight">
                  <p className="text-lg font-bold tabular-nums">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Config */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Config
            </p>
            <div className="rounded-md border bg-muted/30 p-2">
              <ReactJson
                src={config}
                name={false}
                collapsed={2}
                enableClipboard={false}
                displayDataTypes={false}
                displayObjectSize={false}
                style={{ fontSize: 12, fontFamily: 'var(--font-geist-mono), monospace' }}
              />
            </div>
          </div>

          {/* Active tools + scopes */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Tools ({tools.length}):</span>
              {tools.length > 0 ? (
                tools.map((tool) => (
                  <Badge key={tool} variant="secondary" className="font-mono text-[10px]">
                    {tool}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">none</span>
              )}
            </div>
            {scopes.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Scopes:</span>
                {scopes.map((scope) => (
                  <span
                    key={scope}
                    className="rounded-md border px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Request log */}
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Activity className="size-3.5" />
              Request log
            </p>
            <ScrollArea className="max-h-56 rounded-md border bg-muted/30 p-3">
              {logs.length > 0 ? (
                <div className="space-y-1.5">
                  {logs.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2 text-[11px] leading-4">
                      <span
                        className={cn(
                          'mt-0.5 shrink-0',
                          entry.status === 'ok' ? 'text-emerald-500' : 'text-red-500',
                        )}
                      >
                        {entry.status === 'ok' ? '✓' : '✗'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono">
                          <span className="font-medium text-foreground/80">{entry.tool}</span>{' '}
                          <span className="text-muted-foreground">{entry.detail}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-muted-foreground">
                        <span>
                          {entry.durationMs >= 1000
                            ? `${(entry.durationMs / 1000).toFixed(1)}s`
                            : `${entry.durationMs}ms`}
                        </span>
                        <br />
                        <span>{timeAgo(entry.at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">No requests logged yet.</p>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
