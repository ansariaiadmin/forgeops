'use client'

import * as React from 'react'
import type { DocumentType, Project } from '@prisma/client'

import { DocumentEditor } from '@/components/projects/detail/tabs/docs/document-editor'
import { DocumentList } from '@/components/projects/detail/tabs/docs/document-list'
import { NewDocumentDialog } from '@/components/projects/detail/tabs/docs/new-document-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import type { ProjectDocument } from '@/lib/api/docs'
import type { DocumentFormValues } from '@/lib/validations/document'

interface DocsTabProps {
  project: Project
}

/** 📚 Docs: project documentation with markdown editing, AI assist and versions. */
export function DocsTab({ project }: DocsTabProps) {
  const [documents, setDocuments] = React.useState<ProjectDocument[] | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<'ALL' | DocumentType>('ALL')
  const [newOpen, setNewOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ProjectDocument | null>(null)

  // ── load from the real API ──
  async function loadDocuments() {
    try {
      const response = await fetch(`/api/projects/${project.slug}/docs`, { cache: 'no-store' })
      if (!response.ok) throw new Error()
      const data = (await response.json()) as { documents?: ProjectDocument[] }
      setDocuments(data.documents ?? [])
    } catch {
      setDocuments([])
    }
  }

  React.useEffect(() => {
    void loadDocuments()
  }, [project.slug])

  function handleSave(content: string) {
    if (!editing) return
    void fetch(`/api/projects/${project.slug}/docs/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }).then(async (response) => {
      if (response.ok) {
        const data = (await response.json()) as { document?: ProjectDocument }
        if (data.document) {
          setEditing(data.document)
          setDocuments(
            (prev) =>
              prev?.map((doc) => (doc.id === data.document!.id ? data.document! : doc)) ?? prev,
          )
        }
      }
    })
  }

  async function handleCreate(values: DocumentFormValues) {
    const response = await fetch(`/api/projects/${project.slug}/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (response.ok) {
      const data = (await response.json()) as { document?: ProjectDocument }
      await loadDocuments()
      setNewOpen(false)
      if (data.document) setEditing(data.document)
    } else {
      setNewOpen(false)
    }
  }

  if (editing) {
    return (
      <DocumentEditor
        project={project}
        document={editing}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    )
  }

  if (!documents) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <>
      <DocumentList
        documents={documents}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        onOpen={setEditing}
        onNew={() => setNewOpen(true)}
      />
      <NewDocumentDialog open={newOpen} onOpenChange={setNewOpen} onSubmit={handleCreate} />
    </>
  )
}
