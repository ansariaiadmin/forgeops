import type { DocumentType } from '@prisma/client'
import { BookMarked, BookOpen, FileText, Map, ScrollText, type LucideIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { DOC_TYPE_BADGE, DOC_TYPE_LABEL } from '@/lib/api/docs'
import { cn } from '@/lib/utils'

export const DOC_TYPE_ICON: Record<DocumentType, LucideIcon> = {
  README: BookOpen,
  API_DOCS: FileText,
  ARCHITECTURE: Map,
  GUIDE: BookMarked,
  OTHER: ScrollText,
}

/** Colored document type badge (README / API Docs / ...). */
export function DocumentTypeBadge({ type }: { type: DocumentType }) {
  return (
    <Badge variant="outline" className={cn('font-medium', DOC_TYPE_BADGE[type])}>
      {DOC_TYPE_LABEL[type]}
    </Badge>
  )
}
