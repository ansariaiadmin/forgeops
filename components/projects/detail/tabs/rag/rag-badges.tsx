import type { RAGSourceType } from '@prisma/client'
import { BookMarked, FileText, GitBranch, Globe, Link, FileType2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { RAG_TYPE_LABEL, type RagStatus } from '@/lib/api/rag'
import { cn } from '@/lib/utils'

export const RAG_STATUS_BADGE: Record<RagStatus, string> = {
  PENDING: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  INDEXED: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  FAILED: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

export const RAG_STATUS_LABEL: Record<RagStatus, string> = {
  PENDING: 'Pending',
  INDEXED: 'Indexed',
  FAILED: 'Failed',
}

const TYPE_ICON: Record<RAGSourceType, typeof FileText> = {
  FILE: FileText,
  DOCUMENT: BookMarked,
  GIT: GitBranch,
  URL: Globe,
  PDF: FileType2,
  WIKI: Link,
}

/** Colored indexing status badge (Pending / Indexed / Failed). */
export function RagStatusBadge({ status }: { status: RagStatus }) {
  return (
    <Badge variant="outline" className={cn('font-mono text-[10px]', RAG_STATUS_BADGE[status])}>
      {RAG_STATUS_LABEL[status]}
    </Badge>
  )
}

/** Source type badge with icon (File / Document / URL / PDF / ...). */
export function RagTypeBadge({ type }: { type: RAGSourceType }) {
  const Icon = TYPE_ICON[type]
  return (
    <Badge variant="secondary" className="gap-1 font-medium">
      <Icon className="size-3" />
      {RAG_TYPE_LABEL[type]}
    </Badge>
  )
}
