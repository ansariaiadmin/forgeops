'use client'

import * as React from 'react'
import type { MemoryCategory, Project, ProjectMemory } from '@prisma/client'
import { Brain, Pencil, Pin, PinOff, Plus, Search, Trash2 } from 'lucide-react'

import { MemoryDetailDialog } from '@/components/projects/detail/tabs/memory/memory-detail-dialog'
import { MemoryFormDialog } from '@/components/projects/detail/tabs/memory/memory-form-dialog'
import {
  MEMORY_CATEGORIES,
  MEMORY_CATEGORY_META,
  MemoryCategoryBadge,
  MemoryCategoryChip,
} from '@/components/projects/detail/tabs/memory/memory-badges'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  buildHistory,
  collectTags,
  getAvailableMcps,
  getRelatedAgents,
  getRelatedMcps,
  type MemoryListItem,
} from '@/lib/api/memory'
import { mockAgents } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'
import type { MemoryFormValues } from '@/lib/validations/memory'

interface MemoryTabProps {
  project: Project
}

/** 🧠 Project memory: categorized knowledge base with markdown editing. */
export function MemoryTab({ project }: MemoryTabProps) {
  const [items, setItems] = React.useState<MemoryListItem[] | null>(null)
  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<'ALL' | MemoryCategory>('ALL')
  const [tagFilter, setTagFilter] = React.useState('ALL')

  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ProjectMemory | null>(null)
  const [deleting, setDeleting] = React.useState<MemoryListItem | null>(null)
  const [detail, setDetail] = React.useState<MemoryListItem | null>(null)

  // ── load from the real API ──
  async function loadMemories() {
    try {
      const response = await fetch(`/api/projects/${project.slug}/memory`, { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { memories?: ProjectMemory[] }
      setItems(
        (data.memories ?? []).map((memory) => ({
          memory,
          meta: {
            tags:
              ((memory.metadata as Record<string, unknown> | null)?.tags as string[] | undefined) ??
              [],
            pinned:
              ((memory.metadata as Record<string, unknown> | null)?.pinned as
                boolean | undefined) ?? false,
            relatedAgentIds:
              ((memory.metadata as Record<string, unknown> | null)?.relatedAgentIds as
                string[] | undefined) ?? [],
            relatedMcpIds:
              ((memory.metadata as Record<string, unknown> | null)?.relatedMcpIds as
                string[] | undefined) ?? [],
          },
        })),
      )
    } catch {
      setItems([])
    }
  }

  React.useEffect(() => {
    void loadMemories()
  }, [project.slug])

  const allTags = React.useMemo(() => (items ? collectTags(items) : []), [items])

  const filtered = React.useMemo(() => {
    if (!items) return []
    const query = search.trim().toLowerCase()
    return items.filter((item) => {
      const { memory, meta } = item
      if (
        query &&
        !memory.title.toLowerCase().includes(query) &&
        !memory.content.toLowerCase().includes(query)
      ) {
        return false
      }
      if (categoryFilter !== 'ALL' && memory.category !== categoryFilter) return false
      if (tagFilter !== 'ALL' && !meta.tags.includes(tagFilter)) return false
      return true
    })
  }, [items, search, categoryFilter, tagFilter])

  const counts = React.useMemo(() => {
    const map = new Map<MemoryCategory, number>()
    if (items)
      for (const item of items)
        map.set(item.memory.category, (map.get(item.memory.category) ?? 0) + 1)
    return map
  }, [items])

  function updateItem(
    id: string,
    patch: Partial<ProjectMemory>,
    metaPatch?: Partial<MemoryListItem['meta']>,
  ) {
    setItems(
      (prev) =>
        prev?.map((item) =>
          item.memory.id === id
            ? { memory: { ...item.memory, ...patch }, meta: { ...item.meta, ...metaPatch } }
            : item,
        ) ?? prev,
    )
  }

  function togglePin(item: MemoryListItem) {
    const next = !item.meta.pinned
    void fetch(`/api/projects/${project.slug}/memory/${item.memory.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: next ? 'pin' : 'unpin' }),
    })
    updateItem(item.memory.id, { updatedAt: new Date() }, { pinned: next })
  }

  async function handleSubmit(
    values: MemoryFormValues & {
      tags: string[]
      relatedAgentId: string | null
      relatedMcpId: string | null
    },
  ) {
    const now = new Date()
    if (editing) {
      const response = await fetch(`/api/projects/${project.slug}/memory/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          category: values.category,
          content: values.content,
        }),
      })
      if (response.ok) await loadMemories()
      updateItem(
        editing.id,
        { title: values.title, category: values.category, content: values.content, updatedAt: now },
        {
          tags: values.tags,
          relatedAgentIds: values.relatedAgentId ? [values.relatedAgentId] : [],
          relatedMcpIds: values.relatedMcpId ? [values.relatedMcpId] : [],
        },
      )
      setEditing(null)
    } else {
      const response = await fetch(`/api/projects/${project.slug}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: values.title,
          category: values.category,
          content: values.content,
        }),
      })
      if (response.ok) await loadMemories()
    }
    setFormOpen(false)
  }

  function handleDelete() {
    if (!deleting) return
    void fetch(`/api/projects/${project.slug}/memory/${deleting.memory.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete' }),
    })
    setItems((prev) => prev?.filter((item) => item.memory.id !== deleting.memory.id) ?? prev)
    setDeleting(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar: search + category chips + add */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search memories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-8"
            />
          </div>

          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filter by tag">
              <SelectValue placeholder="All tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All tags</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  #{tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            Add Memory
          </Button>
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter('ALL')}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === 'ALL'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Brain className="size-3.5" />
            All
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] tabular-nums',
                categoryFilter === 'ALL' ? 'bg-primary-foreground/20' : 'bg-muted',
              )}
            >
              {items?.length ?? 0}
            </span>
          </button>
          {MEMORY_CATEGORIES.map((category) => (
            <MemoryCategoryChip
              key={category}
              category={category}
              active={categoryFilter === category}
              count={counts.get(category) ?? 0}
              onClick={() => setCategoryFilter(categoryFilter === category ? 'ALL' : category)}
            />
          ))}
        </div>
      </div>

      {/* List */}
      {!items ? (
        <div className="space-y-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <Brain className="size-8 text-muted-foreground" />
            <p className="font-medium">No memories found</p>
            <p className="text-sm text-muted-foreground">
              {items.length === 0
                ? 'This project has no memories yet — add the first one!'
                : 'Try adjusting your search or filters.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const { memory, meta } = item
            const summary = memory.content.replace(/[#*`>\-\[\]()]/g, '').slice(0, 140)
            return (
              <Card
                key={memory.id}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-accent/40',
                  meta.pinned && 'border-amber-500/30',
                )}
                onClick={() => setDetail(item)}
              >
                <CardContent className="flex items-start gap-3 p-4">
                  {/* Pin */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'size-7 shrink-0',
                      meta.pinned ? 'text-amber-500 hover:text-amber-500' : 'text-muted-foreground',
                    )}
                    onClick={(event) => {
                      event.stopPropagation()
                      togglePin(item)
                    }}
                    aria-label={meta.pinned ? 'Unpin memory' : 'Pin memory'}
                    title={meta.pinned ? 'Unpin' : 'Pin'}
                  >
                    {meta.pinned ? <Pin className="size-3.5" /> : <PinOff className="size-3.5" />}
                  </Button>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium leading-snug">{memory.title}</p>
                      <MemoryCategoryBadge category={memory.category} />
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(memory.updatedAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {summary || '…'}
                    </p>
                    {meta.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {meta.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md border bg-muted/40 px-1.5 py-0.5 text-[11px] text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Edit ${memory.title}`}
                      onClick={() => {
                        setEditing(memory)
                        setFormOpen(true)
                      }}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:text-destructive"
                      aria-label={`Delete ${memory.title}`}
                      onClick={() => setDeleting(item)}
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
      <MemoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        memory={editing}
        tags={editing ? parseMeta(editing).tags : []}
        relatedAgentIds={editing ? parseMeta(editing).relatedAgentIds : []}
        relatedMcpIds={editing ? parseMeta(editing).relatedMcpIds : []}
        agents={mockAgents.map((agent) => ({ id: agent.id, name: agent.name }))}
        mcps={getAvailableMcps().map((mcp) => ({ id: mcp.id, name: mcp.name }))}
        onSubmit={handleSubmit}
      />

      <MemoryDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        title={detail?.memory.title ?? ''}
        category={detail?.memory.category ?? 'TODO'}
        content={detail?.memory.content ?? ''}
        meta={detail?.meta ?? { tags: [], pinned: false, relatedAgentIds: [], relatedMcpIds: [] }}
        history={detail ? buildHistory(detail.memory, detail.meta) : []}
        relatedAgents={
          detail
            ? getRelatedAgents(detail.meta.relatedAgentIds).map((a) => ({ id: a.id, name: a.name }))
            : []
        }
        relatedMcps={
          detail
            ? getRelatedMcps(detail.meta.relatedMcpIds).map((m) => ({ id: m.id, name: m.name }))
            : []
        }
        createdAt={detail?.memory.createdAt ?? new Date()}
        updatedAt={detail?.memory.updatedAt ?? new Date()}
      />

      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete memory?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{' '}
              <span className="font-medium text-foreground">{deleting?.memory.title}</span>. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete memory
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function parseMeta(memory: ProjectMemory) {
  const meta = (memory.metadata ?? {}) as {
    tags?: string[]
    pinned?: boolean
    relatedAgentIds?: string[]
    relatedMcpIds?: string[]
  }
  return {
    tags: meta.tags ?? [],
    pinned: meta.pinned ?? false,
    relatedAgentIds: meta.relatedAgentIds ?? [],
    relatedMcpIds: meta.relatedMcpIds ?? [],
  }
}

export { MEMORY_CATEGORY_META }
