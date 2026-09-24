import type { DockerService } from '@prisma/client'
import { ChevronDown, ChevronRight, Play, RotateCw, ScrollText, Square, Trash2 } from 'lucide-react'

import {
  ServiceHealthBadge,
  ServiceStatusBadge,
} from '@/components/projects/detail/tabs/docker/service-status-badges'
import { Button } from '@/components/ui/button'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatPorts } from '@/lib/api/docker'
import { cn } from '@/lib/utils'

interface ServiceRowProps {
  service: DockerService
  expanded: boolean
  busy: boolean
  onToggle: () => void
  onStart: () => void
  onStop: () => void
  onRestart: () => void
  onLogs: () => void
  onDelete: () => void
}

/** One row of the services table + inline action buttons. */
export function ServiceRow({
  service,
  expanded,
  busy,
  onToggle,
  onStart,
  onStop,
  onRestart,
  onLogs,
  onDelete,
}: ServiceRowProps) {
  const ports = formatPorts(service.ports)

  return (
    <TableRow onClick={onToggle} className={cn('cursor-pointer', expanded && 'bg-muted/40')}>
      {/* Expand */}
      <TableCell className="w-8">
        {expanded ? (
          <ChevronDown className="size-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 text-muted-foreground" />
        )}
      </TableCell>

      {/* Name */}
      <TableCell className="font-medium">{service.name}</TableCell>

      {/* Image */}
      <TableCell className="font-mono text-xs text-muted-foreground">{service.image}</TableCell>

      {/* Container ID */}
      <TableCell className="font-mono text-xs text-muted-foreground">
        {service.containerId ? service.containerId.slice(0, 12) : '—'}
      </TableCell>

      {/* Status */}
      <TableCell>
        <ServiceStatusBadge status={service.status} />
      </TableCell>

      {/* Ports */}
      <TableCell className="font-mono text-xs">
        {ports.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {ports.slice(0, 2).map((port) => (
              <span key={port} className="rounded border bg-muted/50 px-1.5 py-0.5">
                {port}
              </span>
            ))}
            {ports.length > 2 && <span className="text-muted-foreground">+{ports.length - 2}</span>}
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Health */}
      <TableCell>
        <ServiceHealthBadge healthStatus={service.healthStatus} />
      </TableCell>

      {/* Actions */}
      <TableCell onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-end gap-0.5">
          {service.status === 'RUNNING' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  disabled={busy}
                  onClick={onStop}
                  aria-label={`Stop ${service.name}`}
                >
                  <Square className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
                  disabled={busy}
                  onClick={onStart}
                  aria-label={`Start ${service.name}`}
                >
                  <Play className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Start</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={busy}
                onClick={onRestart}
                aria-label={`Restart ${service.name}`}
              >
                <RotateCw className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Restart</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={onLogs}
                aria-label={`Logs for ${service.name}`}
              >
                <ScrollText className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Logs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-destructive hover:text-destructive"
                onClick={onDelete}
                aria-label={`Delete ${service.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete</TooltipContent>
          </Tooltip>
        </div>
      </TableCell>
    </TableRow>
  )
}
