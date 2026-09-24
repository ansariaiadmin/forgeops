import { Boxes, CalendarClock, FileStack } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import type { RagStats } from '@/lib/api/rag'
import { formatDate } from '@/utils/format'

/** Knowledge base statistics: sources, chunks and last index date. */
export function RagStatsCards({ stats }: { stats: RagStats }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <Boxes className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-bold tabular-nums">{stats.totalSources}</p>
            <p className="text-xs text-muted-foreground">
              Sources · {stats.indexedSources} indexed
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileStack className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-xl font-bold tabular-nums">{stats.totalChunks}</p>
            <p className="text-xs text-muted-foreground">Total chunks</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <CalendarClock className="size-4" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">
              {stats.lastIndexedAt ? formatDate(stats.lastIndexedAt) : '—'}
            </p>
            <p className="text-xs text-muted-foreground">Last indexing</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
