'use client'

import * as React from 'react'
import type { Project } from '@prisma/client'
import { Plus, Search, Sparkles } from 'lucide-react'

import { AddSourceDialog } from '@/components/projects/detail/tabs/rag/add-source-dialog'
import { RagStatsCards } from '@/components/projects/detail/tabs/rag/rag-stats'
import { SearchResults } from '@/components/projects/detail/tabs/rag/search-results'
import { SourceList } from '@/components/projects/detail/tabs/rag/source-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  computeRagStats,
  searchKnowledgeBase,
  type RagSourceView,
  type RagStats,
  type SearchResult,
} from '@/lib/api/rag'
import type { RagSourceFormValues } from '@/lib/validations/rag'

interface RagTabProps {
  project: Project
}

/** 🔎 RAG knowledge base: sources, indexing and simple text search (MVP). */
export function RagTab({ project }: RagTabProps) {
  const [sources, setSources] = React.useState<RagSourceView[] | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const [indexingId, setIndexingId] = React.useState<string | null>(null)
  const [indexingProgress, setIndexingProgress] = React.useState(0)

  const [query, setQuery] = React.useState('')
  const [results, setResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)

  // ── load sources from the real API ──
  async function loadSources() {
    try {
      const response = await fetch(`/api/projects/${project.slug}/rag/sources`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { sources?: RagSourceView[] }
      setSources(data.sources ?? [])
    } catch {
      setSources([])
    }
  }

  React.useEffect(() => {
    void loadSources()
  }, [project.slug])

  // ── debounced text search ──
  React.useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timeout = window.setTimeout(() => {
      if (sources) {
        setResults(searchKnowledgeBase(sources, trimmed))
      }
      setSearching(false)
    }, 300)
    return () => window.clearTimeout(timeout)
  }, [query, sources])

  const stats: RagStats | null = React.useMemo(
    () => (sources ? computeRagStats(sources) : null),
    [sources],
  )

  const hasQuery = query.trim().length >= 2

  /** Re-index through the real API (POST .../rag/sources/[id]). */
  async function startIndexing(sourceId: string) {
    setIndexingId(sourceId)
    setIndexingProgress(0)
    const response = await fetch(`/api/projects/${project.slug}/rag/sources/${sourceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reindex' }),
    })
    if (response.ok) await loadSources()
    setIndexingId(null)
    setIndexingProgress(100)
  }

  function handleReindex(source: RagSourceView) {
    startIndexing(source.id)
  }

  async function handleAddSource(values: RagSourceFormValues) {
    const response = await fetch(`/api/projects/${project.slug}/rag/sources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (response.ok) await loadSources()
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      {stats ? (
        <RagStatsCards stats={stats} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[72px] w-full" />
          <Skeleton className="h-[72px] w-full" />
        </div>
      )}

      {/* Search + Add */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search the knowledge base…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="pl-8"
          />
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus />
          Add Source
        </Button>
      </div>

      {/* Search results OR source list */}
      {hasQuery ? (
        <SearchResults results={results} query={query.trim()} searching={searching} />
      ) : sources ? (
        <SourceList
          sources={sources}
          indexingId={indexingId}
          indexingProgress={indexingProgress}
          onReindex={handleReindex}
        />
      ) : (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      <AddSourceDialog open={addOpen} onOpenChange={setAddOpen} onSubmit={handleAddSource} />

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
        <Sparkles className="size-3" />
        MVP uses text matching. Embeddings + vector search (pgvector) arrive in the next phase.
      </p>
    </div>
  )
}
