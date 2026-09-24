'use client'

import { Cpu, Database, ExternalLink, Folder, Globe, MemoryStick } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import type { DockerServiceDetail } from '@/lib/api/docker'
import { cn } from '@/lib/utils'

interface ServiceDetailsProps {
  detail: DockerServiceDetail
  onOpenLogs: () => void
}

function LogLine({ line }: { line: string }) {
  const level = line.includes(' ERROR ')
    ? 'text-red-500'
    : line.includes(' WARN ')
      ? 'text-amber-500'
      : ''
  return (
    <div
      className={cn(
        'whitespace-pre-wrap break-all font-mono text-[11px] leading-5',
        level || 'text-muted-foreground',
      )}
    >
      {line}
    </div>
  )
}

/**
 * Expanded service details: env vars, volumes, networks,
 * resource usage (CPU/RAM) and the last 20 log lines.
 */
export function ServiceDetails({ detail, onOpenLogs }: ServiceDetailsProps) {
  const { service, env, runtime } = detail
  const volumes = Array.isArray(service.volumes) ? (service.volumes as string[]) : []
  const networks = Array.isArray(service.networks) ? (service.networks as string[]) : []

  return (
    <div className="grid gap-6 px-2 py-4 lg:grid-cols-2">
      {/* Env vars */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Database className="size-3.5" />
          Environment Variables
        </p>
        {env.length > 0 ? (
          <div className="space-y-1.5">
            {env.map((variable) => (
              <div
                key={variable.key}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-1.5"
              >
                <span className="font-mono text-xs font-medium">{variable.key}</span>
                <span className="truncate font-mono text-xs text-muted-foreground">
                  {variable.isSecret ? '••••••••' : variable.value}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No environment variables.</p>
        )}
      </div>

      {/* Volumes + Networks */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Folder className="size-3.5" />
          Volumes
        </p>
        {volumes.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {volumes.map((volume) => (
              <span
                key={volume}
                className="rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
              >
                {volume}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No volumes mounted.</p>
        )}

        <Separator />

        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Globe className="size-3.5" />
          Networks
        </p>
        {networks.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {networks.map((network) => (
              <span
                key={network}
                className="rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
              >
                {network}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not attached to any network.</p>
        )}
      </div>

      {/* Resource usage */}
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Cpu className="size-3.5" />
          Resource Usage
        </p>
        {runtime ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">CPU</span>
                <span className="font-mono font-medium tabular-nums">
                  {runtime.cpuPercent.toFixed(1)}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-sky-500 transition-all duration-700"
                  style={{ width: `${Math.min(runtime.cpuPercent / 8, 100)}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-mono font-medium tabular-nums">{runtime.memoryMb} MB</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-700"
                  style={{ width: `${Math.min((runtime.memoryMb / 1024) * 100, 100)}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              Live values — auto-refresh every 5 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="h-1.5 w-full animate-pulse rounded-full bg-muted" />
            <div className="h-1.5 w-3/4 animate-pulse rounded-full bg-muted" />
          </div>
        )}
      </div>

      {/* Logs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <MemoryStick className="size-3.5" />
            Last 20 Log Lines
          </p>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpenLogs}>
            <ExternalLink />
            Full logs
          </Button>
        </div>
        {runtime ? (
          <ScrollArea className="h-44 rounded-md border bg-muted/30 p-3">
            <div className="space-y-0.5">
              {runtime.logs.slice(-20).map((line, index) => (
                <LogLine key={index} line={line} />
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="h-44 animate-pulse rounded-md border bg-muted/30" />
        )}
      </div>
    </div>
  )
}
