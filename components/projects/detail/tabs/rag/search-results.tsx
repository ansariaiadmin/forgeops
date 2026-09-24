import { Loader2, SearchX } from 'lucide-react'

import { RagTypeBadge } from '@/components/projects/detail/tabs/rag/rag-badges'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { chunkTitle, type SearchResult } from '@/lib/api/rag'
import { cn } from '@/lib/utils'

function scoreClass(score: number): string {
  if (score >= 70)
    return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  if (score >= 40) return 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
  return 'border-zinc-400/30 bg-zinc-400/10 text-zinc-600 dark:text-zinc-400'
}

interface SearchResultsProps {
  results: SearchResult[]
  query: string
  searching: boolean
}

/** Semantic search results (MVP: text matching) with match scores. */
export function SearchResults({ results, query, searching }: SearchResultsProps) {
  if (searching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching “{query}”…
        </CardContent>
      </Card>
    )
  }

  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <SearchX className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium">No matches</p>
          <p className="text-xs text-muted-foreground">
            Nothing in the knowledge base matched “{query}”. Try a different wording.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <Card key={`${result.source.id}-${result.chunk.id}`}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium leading-snug">{chunkTitle(result.chunk)}</p>
              <Badge
                variant="outline"
                className={cn(
                  'shrink-0 font-mono text-[10px] tabular-nums',
                  scoreClass(result.score),
                )}
              >
                {result.score}% match
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{result.chunk.text}</p>
            <div className="mt-2 flex items-center gap-2">
              <RagTypeBadge type={result.source.type} />
              <span className="truncate font-mono text-xs text-muted-foreground">
                {result.source.path}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
