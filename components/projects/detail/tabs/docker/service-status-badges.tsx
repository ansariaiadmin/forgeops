import type { ServiceStatus } from '@prisma/client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const SERVICE_STATUS_BADGE: Record<ServiceStatus, string> = {
  RUNNING: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  STOPPED: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
  ERROR: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  UNKNOWN: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
}

export const SERVICE_STATUS_LABEL: Record<ServiceStatus, string> = {
  RUNNING: 'Running',
  STOPPED: 'Stopped',
  ERROR: 'Error',
  UNKNOWN: 'Unknown',
}

export type ServiceHealth = 'healthy' | 'unhealthy' | 'stopped' | 'unknown'

export const SERVICE_HEALTH_BADGE: Record<ServiceHealth, string> = {
  healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  unhealthy: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
  stopped: 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400',
  unknown: 'border-muted-foreground/30 bg-muted/50 text-muted-foreground',
}

export const SERVICE_HEALTH_LABEL: Record<ServiceHealth, string> = {
  healthy: 'Healthy',
  unhealthy: 'Unhealthy',
  stopped: 'Stopped',
  unknown: 'Unknown',
}

/** Map the stored healthStatus string to a known level. */
export function toHealthLevel(healthStatus: string): ServiceHealth {
  if (healthStatus === 'healthy' || healthStatus === 'unhealthy') return healthStatus
  if (healthStatus === 'stopped') return 'stopped'
  return 'unknown'
}

/** Colored service status badge (Running / Stopped / Error / Unknown). */
export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', SERVICE_STATUS_BADGE[status])}>
      {SERVICE_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Colored health badge (Healthy / Unhealthy / Stopped / Unknown). */
export function ServiceHealthBadge({ healthStatus }: { healthStatus: string }) {
  const level = toHealthLevel(healthStatus)
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', SERVICE_HEALTH_BADGE[level])}>
      {SERVICE_HEALTH_LABEL[level]}
    </Badge>
  )
}
