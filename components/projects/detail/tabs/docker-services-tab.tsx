'use client'

import * as React from 'react'
import type { DockerService, Project } from '@prisma/client'
import { Loader2, Plus, RefreshCw, RotateCw, Square, Play } from 'lucide-react'

import { ComposePanel } from '@/components/projects/detail/tabs/docker/compose-panel'
import { LogsDialog } from '@/components/projects/detail/tabs/docker/logs-dialog'
import { ServiceFormDialog } from '@/components/projects/detail/tabs/docker/service-form-dialog'
import { ServiceRow } from '@/components/projects/detail/tabs/docker/service-row'
import { ServiceDetails } from '@/components/projects/detail/tabs/docker/service-details'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { usePolling } from '@/hooks/use-polling'
import {
  buildComposeConfig,
  createService,
  getDockerServices,
  getServiceEnv,
  getServiceRuntime,
  parseComposeServices,
  runServiceAction,
  type ComposeConfig,
  type DockerServiceDetail,
} from '@/lib/api/docker'
import { cn } from '@/lib/utils'
import type { ServiceFormValues } from '@/lib/validations/service'

const POLL_INTERVAL_MS = 5000

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface DockerServicesTabProps {
  project: Project
  services: DockerService[]
}

/** 🐳 Docker services: table with live status, details, compose and 5s polling. */
export function DockerServicesTab({ project, services: initialServices }: DockerServicesTabProps) {
  // Services come in via props (server-fetched mock; later: GET /api/projects/[slug]/services)
  // so the table renders immediately — runtimes load client-side below.
  const [items, setItems] = React.useState<DockerServiceDetail[]>(() =>
    initialServices.map((service) => ({
      service,
      env: getServiceEnv(service),
      runtime: null,
    })),
  )
  const [expandedId, setExpandedId] = React.useState<string | null>(null)
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set())
  const [batchBusy, setBatchBusy] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const [addOpen, setAddOpen] = React.useState(false)
  const [logsTarget, setLogsTarget] = React.useState<DockerServiceDetail | null>(null)
  const [logsLoading, setLogsLoading] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<DockerServiceDetail | null>(null)

  const [compose, setCompose] = React.useState<ComposeConfig | null>(() =>
    initialServices.length > 0 ? buildComposeConfig(initialServices) : null,
  )
  const [composeBusy, setComposeBusy] = React.useState<'up' | 'down' | null>(null)
  const [composeStatus, setComposeStatus] = React.useState<'up' | 'down' | null>(null)
  const [composeMessage, setComposeMessage] = React.useState<string | null>(null)

  // ── client-side enrichment (runtimes) + compose config ──
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const details = await Promise.all(
        initialServices.map(async (service) => ({
          service,
          env: getServiceEnv(service),
          runtime: await getServiceRuntime(service),
        })),
      )
      if (!cancelled) {
        setItems(details)
        setLastUpdated(new Date())
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [initialServices])

  // ── 5s polling: fluctuate CPU/RAM, bump lastUpdated ──
  usePolling(() => {
    setItems((prev) =>
      prev.map((detail) => {
        if (!detail.runtime) return detail
        const walk = (value: number, spread: number, min: number, max: number) =>
          Math.min(max, Math.max(min, value + (Math.random() - 0.5) * spread))
        return {
          ...detail,
          runtime: {
            ...detail.runtime,
            cpuPercent: walk(detail.runtime.cpuPercent, 0.8, 0.1, 6),
            memoryMb: Math.round(walk(detail.runtime.memoryMb, 24, 16, 1024)),
          },
        }
      }),
    )
    setLastUpdated(new Date())
  }, POLL_INTERVAL_MS)

  function setServiceStatus(id: string, status: DockerService['status']) {
    setItems((prev) =>
      prev.map((detail) =>
        detail.service.id === id
          ? {
              ...detail,
              service: {
                ...detail.service,
                status,
                healthStatus: status === 'STOPPED' ? 'stopped' : detail.service.healthStatus,
                updatedAt: new Date(),
              },
            }
          : detail,
      ),
    )
  }

  const withBusy = async (ids: string[], action: () => Promise<void>) => {
    setBusyIds((prev) => new Set([...prev, ...ids]))
    try {
      await action()
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev)
        ids.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  const start = (detail: DockerServiceDetail) =>
    withBusy([detail.service.id], async () => {
      await runServiceAction(project.slug, detail.service.id, 'start')
      setServiceStatus(detail.service.id, 'RUNNING')
    })

  const stop = (detail: DockerServiceDetail) =>
    withBusy([detail.service.id], async () => {
      await runServiceAction(project.slug, detail.service.id, 'stop')
      setServiceStatus(detail.service.id, 'STOPPED')
    })

  const restart = (detail: DockerServiceDetail) =>
    withBusy([detail.service.id], async () => {
      await runServiceAction(project.slug, detail.service.id, 'restart')
      setServiceStatus(detail.service.id, 'RUNNING')
    })

  const batch = (status: 'RUNNING' | 'STOPPED') =>
    withBusy(
      items.map((detail) => detail.service.id),
      async () => {
        setBatchBusy(true)
        await delay(1200)
        setItems((prev) =>
          prev.map((detail) => ({
            ...detail,
            service: {
              ...detail.service,
              status,
              healthStatus: status === 'STOPPED' ? 'stopped' : detail.service.healthStatus,
              updatedAt: new Date(),
            },
          })),
        )
        setBatchBusy(false)
      },
    )

  const refresh = async () => {
    setRefreshing(true)
    const services = await getDockerServices(project.slug)
    const details = await Promise.all(
      services.map(async (service) => ({
        service,
        env: getServiceEnv(service),
        runtime: await getServiceRuntime(service),
      })),
    )
    setItems(details)
    setLastUpdated(new Date())
    setRefreshing(false)
  }

  // ── logs dialog ──
  const openLogs = (detail: DockerServiceDetail) => {
    setLogsTarget(detail)
  }
  const refreshLogs = async () => {
    if (!logsTarget) return
    setLogsLoading(true)
    const runtime = await getServiceRuntime(logsTarget.service)
    setLogsTarget((prev) => (prev ? { ...prev, runtime } : prev))
    setLogsLoading(false)
  }

  // ── add service (real API) ──
  const handleAddService = async (values: ServiceFormValues) => {
    const created = await createService(project.slug, {
      name: values.name,
      image: values.image,
      ports: values.ports,
      volumes: values.volumes,
      networks: values.networks,
    })
    if (created) {
      const detail: DockerServiceDetail = {
        service: created,
        env: getServiceEnv(created),
        runtime: null,
      }
      setItems((prev) => [...prev, detail])
    }
    setAddOpen(false)
  }

  // ── compose ──
  const handleComposeUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const content = String(reader.result ?? '')
      setCompose({ filename: file.name, content, services: parseComposeServices(content) })
      setComposeStatus(null)
      setComposeMessage(`Uploaded ${file.name}`)
    }
    reader.readAsText(file)
  }

  const composeUp = async () => {
    if (!compose) return
    setComposeBusy('up')
    await delay(1400)
    setComposeStatus('up')
    setComposeBusy(null)
    setComposeMessage(`Stack is up — ${compose.services.length} services started`)
  }

  const composeDown = async () => {
    setComposeBusy('down')
    await delay(1200)
    setComposeStatus('down')
    setComposeBusy(null)
    setComposeMessage('Stack is down — all services stopped')
  }

  return (
    <div className="flex flex-col gap-6">
      {' '}
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh services"
          >
            <RefreshCw className={cn(refreshing && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => batch('RUNNING')}
            disabled={batchBusy || items.length === 0}
          >
            {batchBusy ? <Loader2 className="animate-spin" /> : <Play />}
            Start All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => batch('STOPPED')}
            disabled={batchBusy || items.length === 0}
          >
            <Square />
            Stop All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              withBusy(
                items.map((d) => d.service.id),
                async () => {
                  setBatchBusy(true)
                  await delay(1200)
                  setItems((prev) =>
                    prev.map((detail) => ({
                      ...detail,
                      service: {
                        ...detail.service,
                        status: 'RUNNING' as const,
                        updatedAt: new Date(),
                      },
                    })),
                  )
                  setBatchBusy(false)
                },
              )
            }
            disabled={batchBusy || items.length === 0}
          >
            <RotateCw />
            Restart All
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Live · polls every 5s
            {lastUpdated && (
              <span className="tabular-nums">
                · updated {Math.max(1, Math.round((Date.now() - lastUpdated.getTime()) / 1000))}s
                ago
              </span>
            )}
          </span>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus />
            Add Service
          </Button>
        </div>
      </div>
      {/* Services table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-8" />
              <TableHead>Service</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Container ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ports</TableHead>
              <TableHead>Health</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={8} className="h-32 text-center text-sm text-muted-foreground">
                  {refreshing
                    ? 'Loading services...'
                    : 'No services yet — add one with "+ Add Service".'}
                </TableCell>
              </TableRow>
            ) : (
              items.map((detail) => {
                const { service } = detail
                const isExpanded = service.id === expandedId
                const isBusy = busyIds.has(service.id)
                return (
                  <React.Fragment key={service.id}>
                    <ServiceRow
                      service={service}
                      expanded={isExpanded}
                      busy={isBusy}
                      onToggle={() => setExpandedId(isExpanded ? null : service.id)}
                      onStart={() => start(detail)}
                      onStop={() => stop(detail)}
                      onRestart={() => restart(detail)}
                      onLogs={() => openLogs(detail)}
                      onDelete={() => setDeleteTarget(detail)}
                    />
                    {isExpanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={8} className="border-b bg-muted/20 p-4">
                          <ServiceDetails detail={detail} onOpenLogs={() => openLogs(detail)} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </Card>
      {/* Compose */}
      <ComposePanel
        compose={compose}
        busy={composeBusy}
        status={composeStatus}
        message={composeMessage}
        onUpload={handleComposeUpload}
        onUp={composeUp}
        onDown={composeDown}
      />
      {/* Dialogs */}
      <ServiceFormDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddService} />
      <LogsDialog
        open={!!logsTarget}
        onOpenChange={(open) => {
          if (!open) setLogsTarget(null)
        }}
        serviceName={logsTarget?.service.name ?? null}
        logs={logsTarget?.runtime?.logs ?? []}
        loading={logsLoading}
        onRefresh={refreshLogs}
      />
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove{' '}
              <span className="font-medium text-foreground">{deleteTarget?.service.name}</span> (
              {deleteTarget?.service.image}). The container will be stopped and removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  void runServiceAction(project.slug, deleteTarget.service.id, 'delete')
                  setItems((prev) =>
                    prev.filter((detail) => detail.service.id !== deleteTarget.service.id),
                  )
                  if (expandedId === deleteTarget.service.id) setExpandedId(null)
                }
                setDeleteTarget(null)
              }}
            >
              Delete service
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
