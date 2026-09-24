import { FileStack, RefreshCw } from 'lucide-react'

import { RagStatusBadge, RagTypeBadge } from '@/components/projects/detail/tabs/rag/rag-badges'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { readChunks, type RagSourceView } from '@/lib/api/rag'
import { formatDate, timeAgo } from '@/utils/format'

interface SourceListProps {
  sources: RagSourceView[]
  indexingId: string | null
  indexingProgress: number
  onReindex: (source: RagSourceView) => void
}

/** Knowledge base sources as cards with status, chunks and re-index. */
export function SourceList({ sources, indexingId, indexingProgress, onReindex }: SourceListProps) {
  return (
    <div className="space-y-2">
      {sources.map((source) => {
        const isIndexing = indexingId === source.id
        const chunks = readChunks(source)
        return (
          <Card key={source.id} className={isIndexing ? 'border-primary/40' : undefined}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{source.path.split('/').pop()}</p>
                    <RagTypeBadge type={source.type} />
                    <RagStatusBadge status={source.status} />
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                    {source.path}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right leading-tight">
                    <p className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                      <FileStack className="size-3" />
                      {chunks.length} chunks
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {source.lastIndexedAt
                        ? `Indexed ${timeAgo(source.lastIndexedAt)}`
                        : 'Not indexed yet'}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isIndexing}
                    onClick={() => onReindex(source)}
                  >
                    <RefreshCw className={isIndexing ? 'animate-spin' : undefined} />
                    {source.status === 'FAILED' ? 'Retry' : 'Re-index'}
                  </Button>
                </div>
              </div>

              {/* Indexing progress */}
              {isIndexing && (
                <div className="mt-3 space-y-1">
                  <Progress value={indexingProgress} />
                  <p className="text-right text-[11px] tabular-nums text-muted-foreground">
                    Indexing… {Math.round(indexingProgress)}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      <p className="pt-1 text-center text-[11px] text-muted-foreground">
        {sources.length} sources · last updated{' '}
        {sources.length > 0 && sources[0].updatedAt ? timeAgo(sources[0].updatedAt) : '—'}
      </p>
    </div>
  )
}

export { formatDate }
