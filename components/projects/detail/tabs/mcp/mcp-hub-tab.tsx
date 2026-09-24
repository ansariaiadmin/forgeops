'use client'

import * as React from 'react'
import type { MCPConnection, Prisma, Project } from '@prisma/client'
import {
  Cable,
  Loader2,
  Pencil,
  Plug,
  Plus,
  RotateCw,
  Search,
  Square,
  Trash2,
  Zap,
} from 'lucide-react'

import { McpDashboard } from '@/components/projects/detail/tabs/mcp/mcp-dashboard'
import { McpDetailDialog } from '@/components/projects/detail/tabs/mcp/mcp-detail-dialog'
import { McpFormDialog } from '@/components/projects/detail/tabs/mcp/mcp-form-dialog'
import { McpStatusBadge, McpTypeBadge } from '@/components/projects/detail/tabs/mcp/mcp-badges'
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
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { countAllowedTools, testMcpConnection, type McpTestResult } from '@/lib/api/mcp'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'
import type { McpFormValues } from '@/lib/validations/mcp'

interface McpHubTabProps {
  project: Project
}

/** 🔌 MCP Hub: manage external tool connections with status dashboard. */
export function McpHubTab({ project }: McpHubTabProps) {
  const [connections, setConnections] = React.useState<MCPConnection[] | null>(null)
  const [search, setSearch] = React.useState('')

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<MCPConnection | null>(null)
  const [deleting, setDeleting] = React.useState<MCPConnection | null>(null)
  const [detail, setDetail] = React.useState<MCPConnection | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  // ── load from the real API ──
  async function loadConnections() {
    try {
      const response = await fetch(`/api/projects/${project.slug}/mcp`, { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { connections?: MCPConnection[] }
      setConnections(data.connections ?? [])
    } catch {
      setConnections([])
    }
  }

  React.useEffect(() => {
    void loadConnections()
  }, [project.slug])

  const filtered = React.useMemo(() => {
    if (!connections) return []
    const query = search.trim().toLowerCase()
    if (!query) return connections
    return connections.filter(
      (connection) =>
        connection.name.toLowerCase().includes(query) ||
        connection.type.toLowerCase().includes(query),
    )
  }, [connections, search])

  function setStatus(id: string, status: MCPConnection['status']) {
    setConnections(
      (prev) =>
        prev?.map((connection) =>
          connection.id === id
            ? {
                ...connection,
                status,
                lastConnectedAt: status === 'CONNECTED' ? new Date() : connection.lastConnectedAt,
                updatedAt: new Date(),
              }
            : connection,
        ) ?? prev,
    )
  }

  const withBusy = async (id: string, action: () => Promise<void>) => {
    setBusyId(id)
    try {
      await action()
    } finally {
      setBusyId(null)
    }
  }

  const connect = (connection: MCPConnection) =>
    withBusy(connection.id, async () => {
      await fetch(`/api/projects/${project.slug}/mcp/${connection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      })
      setStatus(connection.id, 'CONNECTED')
    })

  const disconnect = (connection: MCPConnection) =>
    withBusy(connection.id, async () => {
      await fetch(`/api/projects/${project.slug}/mcp/${connection.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect' }),
      })
      setStatus(connection.id, 'DISCONNECTED')
    })

  const restart = (connection: MCPConnection) =>
    withBusy(connection.id, async () => {
      await connect(connection)
    })

  const handleTest = async (connection: MCPConnection) => {
    await withBusy(connection.id, async () => {
      const result: McpTestResult = await testMcpConnection(connection)
      if (result.ok && connection.status !== 'CONNECTED') setStatus(connection.id, 'CONNECTED')
    })
  }

  function handleSubmit(values: McpFormValues) {
    const config = JSON.parse(values.configJson) as Prisma.JsonValue
    if (editing) {
      setConnections(
        (prev) =>
          prev?.map((connection) =>
            connection.id === editing.id
              ? {
                  ...connection,
                  name: values.name,
                  type: values.type,
                  config,
                  allowedTools: values.allowedTools,
                  scopes: values.scopesInput
                    ? values.scopesInput
                        .split(',')
                        .map((scope) => scope.trim())
                        .filter(Boolean)
                    : [],
                  updatedAt: new Date(),
                }
              : connection,
          ) ?? prev,
      )
      setEditing(null)
    } else {
      const connection: MCPConnection = {
        id: `mcp-${Math.random().toString(36).slice(2, 7)}`,
        projectId: project.id,
        name: values.name,
        type: values.type,
        status: 'DISCONNECTED',
        config,
        allowedTools: values.allowedTools,
        scopes: values.scopesInput
          ? values.scopesInput
              .split(',')
              .map((scope) => scope.trim())
              .filter(Boolean)
          : [],
        lastConnectedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      setConnections((prev) => [connection, ...(prev ?? [])])
    }
    setFormOpen(false)
  }

  function handleDelete() {
    if (!deleting) return
    void fetch(`/api/projects/${project.slug}/mcp/${deleting.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    })
    setConnections((prev) => prev?.filter((connection) => connection.id !== deleting.id) ?? prev)
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status dashboard */}
      {connections && <McpDashboard connections={connections} />}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search connections..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus />
          Add MCP Connection
        </Button>
      </div>

      {/* Connection list */}
      {!connections ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <Cable className="size-8 text-muted-foreground" />
            <p className="font-medium">No connections found</p>
            <p className="text-sm text-muted-foreground">
              {connections.length === 0
                ? 'Connect your first MCP server to give agents external tools.'
                : 'Try a different search term.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((connection) => {
            const toolsCount = countAllowedTools(connection)
            const isBusy = busyId === connection.id
            return (
              <Card
                key={connection.id}
                className="cursor-pointer transition-colors hover:bg-accent/40"
                onClick={() => setDetail(connection)}
              >
                <CardContent className="flex flex-wrap items-center gap-4 p-4">
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      connection.status === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : connection.status === 'ERROR'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Plug className="size-4" />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{connection.name}</p>
                      <McpTypeBadge type={connection.type} />
                      <McpStatusBadge status={connection.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {toolsCount} tools ·{' '}
                      {connection.lastConnectedAt
                        ? `last connected ${timeAgo(connection.lastConnectedAt)}`
                        : 'never connected'}
                    </p>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    {connection.status === 'CONNECTED' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        disabled={isBusy}
                        onClick={() => disconnect(connection)}
                        aria-label={`Disconnect ${connection.name}`}
                        title="Disconnect"
                      >
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Square className="size-3.5" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400"
                        disabled={isBusy}
                        onClick={() => connect(connection)}
                        aria-label={`Connect ${connection.name}`}
                        title="Connect"
                      >
                        {isBusy ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Plug className="size-3.5" />
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={isBusy}
                      onClick={() => restart(connection)}
                      aria-label={`Restart ${connection.name}`}
                      title="Restart"
                    >
                      <RotateCw className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => handleTest(connection)}
                      disabled={isBusy}
                      aria-label={`Test ${connection.name}`}
                      title="Test connection"
                    >
                      <Zap className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => {
                        setEditing(connection)
                        setFormOpen(true)
                      }}
                      aria-label={`Edit ${connection.name}`}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleting(connection)}
                      aria-label={`Delete ${connection.name}`}
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialogs */}
      <McpFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        connection={editing}
        onSubmit={handleSubmit}
      />

      <McpDetailDialog
        connection={detail}
        onOpenChange={(open) => !open && setDetail(null)}
        onTestResult={(result) => {
          if (detail && result.ok) setStatus(detail.id, 'CONNECTED')
        }}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to remove{' '}
              <span className="font-medium text-foreground">{deleting?.name}</span>. Agents will
              lose access to its tools immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete connection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
