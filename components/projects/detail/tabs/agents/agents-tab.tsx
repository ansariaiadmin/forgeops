'use client'

import * as React from 'react'
import type { Agent, AgentType, Project } from '@prisma/client'
import { Bot, Plus, Search, Square } from 'lucide-react'

import { AgentCard } from '@/components/projects/detail/tabs/agents/agent-card'
import { AgentDetailDialog } from '@/components/projects/detail/tabs/agents/agent-detail-dialog'
import { AgentFormDialog } from '@/components/projects/detail/tabs/agents/agent-form-dialog'
import { JobQueue } from '@/components/projects/detail/tabs/agents/job-queue'
import { NewJobDialog } from '@/components/projects/detail/tabs/agents/new-job-dialog'
import { AGENT_TYPE_ICON } from '@/components/projects/detail/tabs/agents/agent-badges'
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
import { AGENT_TYPES, AGENT_TYPE_LABEL, countTodayJobs, type AgentJobView } from '@/lib/api/agents'
import { cn } from '@/lib/utils'
import type { AgentFormValues } from '@/lib/validations/agent'

interface AgentsTabProps {
  project: Project
  agents: Agent[]
}

/** 🤖 Agents: manage AI agents, their jobs and consumption. */
export function AgentsTab({ project, agents: initialAgents }: AgentsTabProps) {
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | AgentType>('ALL')

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Agent | null>(null)
  const [deleting, setDeleting] = React.useState<Agent | null>(null)
  const [detail, setDetail] = React.useState<Agent | null>(null)
  const [jobTarget, setJobTarget] = React.useState<Agent | null>(null)
  const [busyId, setBusyId] = React.useState<string | null>(null)

  const [jobs, setJobs] = React.useState<AgentJobView[]>(() => [])

  const mcps: Array<{ id: string; name: string }> = []

  const filtered = React.useMemo(() => {
    const query = search.trim().toLowerCase()
    return agents.filter((agent) => {
      if (query && !agent.name.toLowerCase().includes(query)) return false
      if (typeFilter !== 'ALL' && agent.type !== typeFilter) return false
      return true
    })
  }, [agents, search, typeFilter])

  const typeCounts = React.useMemo(() => {
    const map = new Map<AgentType, number>()
    for (const agent of agents) map.set(agent.type, (map.get(agent.type) ?? 0) + 1)
    return map
  }, [agents])

  // ── load agents + jobs from the real API ──
  async function loadAgents() {
    try {
      const response = await fetch(`/api/projects/${project.slug}/agents`, { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { agents?: Agent[] }
      setAgents(data.agents ?? [])
    } catch {
      setAgents([])
    }
  }

  React.useEffect(() => {
    void loadAgents()
  }, [project.slug])

  function setAgentStatus(id: string, status: Agent['status']) {
    setAgents((prev) =>
      prev.map((agent) => (agent.id === id ? { ...agent, status, updatedAt: new Date() } : agent)),
    )
  }

  /** Today's tokens for an agent (mock derivation from totalTokensUsed). */
  function todayTokens(agent: Agent): number {
    return Math.round(agent.totalTokensUsed / 30)
  }

  async function handleRun(agent: Agent) {
    setJobTarget(agent)
  }

  async function handleRunJob(task: string) {
    if (!jobTarget) return
    const agent = jobTarget
    setBusyId(agent.id)
    setAgentStatus(agent.id, 'RUNNING')
    setJobTarget(null)

    // Real execution: the API runs the LLM layer (real model with
    // OPENAI_API_KEY, mock otherwise) and stores the AgentJob.
    const response = await fetch(`/api/projects/${project.slug}/agents/${agent.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'run', task }),
    })
    if (response.ok) {
      const data = (await response.json()) as { job?: AgentJobView }
      if (data.job) setJobs((prev) => [data.job!, ...prev])
    }
    setAgentStatus(agent.id, 'IDLE')
    setBusyId(null)
  }

  function handleStopAll() {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.status === 'RUNNING' ? { ...agent, status: 'IDLE', updatedAt: new Date() } : agent,
      ),
    )
    setJobs((prev) =>
      prev.map((job) =>
        job.status === 'RUNNING' ? { ...job, status: 'FAILED', error: 'Stopped manually' } : job,
      ),
    )
  }

  async function handleSubmit(values: AgentFormValues) {
    const url = editing
      ? `/api/projects/${project.slug}/agents/${editing.id}`
      : `/api/projects/${project.slug}/agents`
    await fetch(url, {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    await loadAgents()
    setEditing(null)
    setFormOpen(false)
  }

  function handleDelete() {
    if (!deleting) return
    void fetch(`/api/projects/${project.slug}/agents/${deleting.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    })
    setAgents((prev) => prev.filter((agent) => agent.id !== deleting.id))
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search agents..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleStopAll} disabled={busyId !== null}>
          <Square />
          Stop All
        </Button>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
        >
          <Plus />
          Create Agent
        </Button>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setTypeFilter('ALL')}
          className={cn(
            'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
            typeFilter === 'ALL'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          <Bot className="size-3.5" />
          All
          <span
            className={cn(
              'rounded-full px-1.5 text-[10px] tabular-nums',
              typeFilter === 'ALL' ? 'bg-primary-foreground/20' : 'bg-muted',
            )}
          >
            {agents.length}
          </span>
        </button>
        {AGENT_TYPES.map((type) => {
          const Icon = AGENT_TYPE_ICON[type]
          const active = typeFilter === type
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(active ? 'ALL' : type)}
              className={cn(
                'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="size-3.5" />
              {AGENT_TYPE_LABEL[type]}
              <span
                className={cn(
                  'rounded-full px-1.5 text-[10px] tabular-nums',
                  active ? 'bg-primary-foreground/20' : 'bg-muted',
                )}
              >
                {typeCounts.get(type) ?? 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <Bot className="size-8 text-muted-foreground" />
            <p className="font-medium">No agents found</p>
            <p className="text-sm text-muted-foreground">
              {agents.length === 0
                ? 'Create your first agent to start automating.'
                : 'Try a different filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              todayJobs={countTodayJobs(agent.id)}
              todayTokens={todayTokens(agent)}
              busy={busyId === agent.id}
              onRun={() => handleRun(agent)}
              onEdit={() => {
                setEditing(agent)
                setFormOpen(true)
              }}
              onDelete={() => setDeleting(agent)}
              onViewJobs={() => setDetail(agent)}
            />
          ))}
        </div>
      )}

      {/* Job queue */}
      <JobQueue jobs={jobs} />

      {/* Dialogs */}
      <AgentFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        agent={editing}
        mcps={mcps.map((mcp) => ({ id: mcp.id, name: mcp.name }))}
        onSubmit={handleSubmit}
      />

      <NewJobDialog
        agent={jobTarget}
        onOpenChange={(open) => !open && setJobTarget(null)}
        onRun={handleRunJob}
      />

      <AgentDetailDialog agent={detail} onOpenChange={(open) => !open && setDetail(null)} />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete agent?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to delete{' '}
              <span className="font-medium text-foreground">{deleting?.name}</span> and all of its
              jobs. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete agent
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
