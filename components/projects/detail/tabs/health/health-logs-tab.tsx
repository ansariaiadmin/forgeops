'use client'

import * as React from 'react'
import type { Project } from '@prisma/client'

import { AlertsPanel } from '@/components/projects/detail/tabs/health/alerts-panel'
import { HealthScorePanel } from '@/components/projects/detail/tabs/health/health-score-panel'
import { LiveLogsPanel } from '@/components/projects/detail/tabs/health/live-logs-panel'
import { LiveMetricsCharts } from '@/components/projects/detail/tabs/health/live-metrics-charts'
import { ServiceHealthCards } from '@/components/projects/detail/tabs/health/service-health-cards'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getHealthSummary,
  getServiceHealth,
  type HealthSummary,
  type ServiceHealth,
} from '@/lib/api/health'

interface HealthLogsTabProps {
  project: Project
}

/** 📊 Health & Logs: score dashboard, service health, live logs, alerts and metrics. */
export function HealthLogsTab({ project }: HealthLogsTabProps) {
  const [summary, setSummary] = React.useState<HealthSummary | null>(null)
  const [services, setServices] = React.useState<ServiceHealth[] | null>(null)
  const [logService, setLogService] = React.useState<string | null>(null)

  // ── load (mock; later: GET /api/projects/[slug]/health + /metrics) ──
  React.useEffect(() => {
    let cancelled = false
    Promise.all([getHealthSummary(project.id), getServiceHealth(project.id)]).then(
      ([health, serviceHealth]) => {
        if (cancelled) return
        setSummary(health)
        setServices(serviceHealth)
      },
    )
    return () => {
      cancelled = true
    }
  }, [project.id])

  return (
    <div className="flex flex-col gap-6">
      {/* Score + services */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          {summary ? <HealthScorePanel summary={summary} /> : <Skeleton className="h-96 w-full" />}
        </div>
        <div className="lg:col-span-8">
          {services ? (
            <ServiceHealthCards services={services} onViewLogs={setLogService} />
          ) : (
            <Skeleton className="h-96 w-full" />
          )}
        </div>
      </div>

      {/* Live logs */}
      <LiveLogsPanel slug={project.slug} focusService={logService} />

      {/* Alerts + metrics */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <AlertsPanel />
        </div>
        <div className="xl:col-span-7">
          <LiveMetricsCharts slug={project.slug} />
        </div>
      </div>

      {/* Service log dialog (from "View Logs") */}
      <Dialog open={!!logService} onOpenChange={(open) => !open && setLogService(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Service logs — {logService}</DialogTitle>
            <DialogDescription>Filtered live stream for this service.</DialogDescription>
          </DialogHeader>
          <LiveLogsPanel slug={project.slug} focusService={logService} />
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setLogService(null)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
