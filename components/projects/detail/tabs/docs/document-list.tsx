import * as React from 'react'
import type { DocumentType } from '@prisma/client'
import { BookOpen, ChevronRight, FilePlus2 } from 'lucide-react'

import {
  DocumentTypeBadge,
  DOC_TYPE_ICON,
} from '@/components/projects/detail/tabs/docs/document-badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DOC_TYPE_LABEL, DOC_TYPE_OPTIONS, type ProjectDocument } from '@/lib/api/docs'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

interface DocumentListProps {
  documents: ProjectDocument[]
  typeFilter: 'ALL' | DocumentType
  onTypeFilterChange: (filter: 'ALL' | DocumentType) => void
  onOpen: (document: ProjectDocument) => void
  onNew: () => void
}

/** Document list with type filters, version info and the "New Document" button. */
export function DocumentList({
  documents,
  typeFilter,
  onTypeFilterChange,
  onOpen,
  onNew,
}: DocumentListProps) {
  const filtered =
    typeFilter === 'ALL' ? documents : documents.filter((doc) => doc.type === typeFilter)

  const counts = React.useMemo(() => {
    const map = new Map<DocumentType, number>()
    for (const doc of documents) map.set(doc.type, (map.get(doc.type) ?? 0) + 1)
    return map
  }, [documents])

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onTypeFilterChange('ALL')}
            className={cn(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
              typeFilter === 'ALL'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <BookOpen className="size-3.5" />
            All
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] tabular-nums',
                typeFilter === 'ALL' ? 'bg-primary-foreground/20' : 'bg-muted',
              )}
            >
              {documents.length}
            </span>
          </button>
          {DOC_TYPE_OPTIONS.map((type) => {
            const Icon = DOC_TYPE_ICON[type]
            const active = typeFilter === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => onTypeFilterChange(active ? 'ALL' : type)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="size-3.5" />
                {DOC_TYPE_LABEL[type]}
                <span
                  className={cn(
                    'rounded-full px-1.5 text-[10px] tabular-nums',
                    active ? 'bg-primary-foreground/20' : 'bg-muted',
                  )}
                >
                  {counts.get(type) ?? 0}
                </span>
              </button>
            )
          })}
        </div>

        <Button size="sm" onClick={onNew}>
          <FilePlus2 />
          New Document
        </Button>
      </div>

      {/* Rows */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="font-medium">No documents found</p>
            <p className="text-sm text-muted-foreground">
              {documents.length === 0
                ? 'Write your first document to share knowledge with the team and agents.'
                : 'Try a different type filter.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => {
            const Icon = DOC_TYPE_ICON[doc.type]
            return (
              <Card
                key={doc.id}
                className="cursor-pointer transition-colors hover:bg-accent/40"
                onClick={() => onOpen(doc)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{doc.title}</p>
                      <DocumentTypeBadge type={doc.type} />
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {doc.path}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      v{doc.version}
                    </Badge>
                    <span className="hidden w-28 text-right text-xs text-muted-foreground sm:block">
                      {timeAgo(doc.updatedAt)}
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
