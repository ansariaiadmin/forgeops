'use client'

import * as React from 'react'
import type { Project } from '@prisma/client'
import { FolderKanban, Loader2, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { ProjectCard } from '@/components/projects/project-card'
import { DeleteProjectDialog } from '@/components/projects/delete-project-dialog'
import {
  ProjectFilters,
  type EnvironmentFilter,
  type StatusFilter,
} from '@/components/projects/project-filters'
import { ProjectFormDialog } from '@/components/projects/project-form-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { mockUsers } from '@/lib/mock-data'
import type { ProjectFormValues } from '@/lib/validations/project'

interface ProjectWithCounts extends Project {
  servicesCount: number
  agentsCount: number
}

/** Projects page: real API (GET/POST/PATCH/DELETE /api/projects) + filters. */
export function ProjectsView() {
  const { data: session } = useSession()

  const [projects, setProjects] = React.useState<ProjectWithCounts[] | null>(null)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<StatusFilter>('ALL')
  const [environment, setEnvironment] = React.useState<EnvironmentFilter>('ALL')
  const [owner, setOwner] = React.useState('ALL')

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Project | null>(null)
  const [deleting, setDeleting] = React.useState<ProjectWithCounts | null>(null)
  const [saving, setSaving] = React.useState(false)

  // ── load from the real API ──
  async function loadProjects() {
    try {
      const response = await fetch('/api/projects', { cache: 'no-store' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = (await response.json()) as { projects?: ProjectWithCounts[] }
      setProjects(data.projects ?? [])
    } catch {
      setProjects([])
    }
  }

  React.useEffect(() => {
    void loadProjects()
  }, [])

  const hasFilters =
    search.trim() !== '' || status !== 'ALL' || environment !== 'ALL' || owner !== 'ALL'

  const filtered = React.useMemo(() => {
    if (!projects) return []
    const query = search.trim().toLowerCase()
    return [...projects]
      .filter((project) => {
        if (
          query &&
          !project.name.toLowerCase().includes(query) &&
          !(project.description ?? '').toLowerCase().includes(query)
        ) {
          return false
        }
        if (status !== 'ALL' && project.status !== status) return false
        if (environment !== 'ALL' && project.environment !== environment) return false
        if (owner !== 'ALL' && project.ownerId !== owner) return false
        return true
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [projects, search, status, environment, owner])

  function clearFilters() {
    setSearch('')
    setStatus('ALL')
    setEnvironment('ALL')
    setOwner('ALL')
  }

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(project: Project) {
    setEditing(project)
    setFormOpen(true)
  }

  async function handleSubmit(values: ProjectFormValues) {
    setSaving(true)
    try {
      if (editing) {
        const response = await fetch(`/api/projects/${editing.slug}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        })
        if (response.ok) await loadProjects()
      } else {
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, ownerId: session?.user?.id }),
        })
        if (response.ok) await loadProjects()
      }
    } finally {
      setSaving(false)
      setEditing(null)
      setFormOpen(false)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const response = await fetch(`/api/projects/${deleting.slug}`, { method: 'DELETE' })
    if (response.ok) await loadProjects()
    setDeleting(null)
  }

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {projects ? `${projects.length} projects in your workspace` : 'Loading projects…'}
          </p>
        </div>
        <Button onClick={openCreate} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" /> : <Plus />}
          New Project
        </Button>
      </div>

      {/* Filters & search */}
      <ProjectFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        environment={environment}
        onEnvironmentChange={setEnvironment}
        owner={owner}
        onOwnerChange={setOwner}
        owners={mockUsers}
        resultCount={filtered.length}
        totalCount={projects?.length ?? 0}
        hasFilters={hasFilters}
        onClear={clearFilters}
      />

      {/* Grid / empty state */}
      {!projects ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <FolderKanban className="size-8 text-muted-foreground" />
          <p className="font-medium">No projects found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              servicesCount={project.servicesCount}
              agentsCount={project.agentsCount}
              onEdit={() => openEdit(project)}
              onDelete={() => setDeleting(project)}
            />
          ))}
        </div>
      )}

      {/* New / edit dialog */}
      <ProjectFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        project={editing}
        onSubmit={handleSubmit}
      />

      {/* Delete confirmation */}
      <DeleteProjectDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        projectName={deleting?.name ?? null}
        onConfirm={handleDelete}
      />
    </div>
  )
}
