import { Container, Cpu, MemoryStick, ScrollText, Timer } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  SERVICE_HEALTH_BADGE,
  SERVICE_HEALTH_LABEL,
} from '@/components/projects/detail/tabs/docker/service-status-badges'
import type { ServiceHealth } from '@/lib/api/health'
import { cn } from '@/lib/utils'

function formatUptime(seconds: number): string {
  if (seconds <= 0) return '—'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

interface ServiceHealthCardsProps {
  services: ServiceHealth[]
  onViewLogs: (serviceName: string) => void
}

/** Per-service health cards with CPU, RAM and uptime. */
export function ServiceHealthCards({ services, onViewLogs }: ServiceHealthCardsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Service Health</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        {services.map((service) => {
          const running = service.status === 'RUNNING'
          return (
            <div
              key={service.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Container className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-medium">{service.name}</p>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-mono text-[10px]',
                      SERVICE_HEALTH_BADGE[
                        service.healthStatus as keyof typeof SERVICE_HEALTH_BADGE
                      ] ?? 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
                    )}
                  >
                    {SERVICE_HEALTH_LABEL[
                      service.healthStatus as keyof typeof SERVICE_HEALTH_LABEL
                    ] ?? service.healthStatus}
                  </Badge>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Cpu className="size-3" />
                    {running ? `${service.cpuPercent}%` : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MemoryStick className="size-3" />
                    {running ? `${service.memoryMb} MB` : '—'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Timer className="size-3" />
                    {formatUptime(service.uptimeSec)}
                  </span>
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onViewLogs(service.name)}
              >
                <ScrollText />
                View Logs
              </Button>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
