'use client'

import * as React from 'react'
import type { Project } from '@prisma/client'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileDown,
  FileText,
  History,
  Loader2,
  Maximize2,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
  X,
} from 'lucide-react'

import { DocumentTypeBadge } from '@/components/projects/detail/tabs/docs/document-badges'
import { VersionHistoryDialog } from '@/components/projects/detail/tabs/docs/version-history-dialog'
import { MarkdownEditor } from '@/components/projects/detail/tabs/memory/markdown-editor'
import { MarkdownView } from '@/components/projects/detail/tabs/context/file-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ProjectDocument } from '@/lib/api/docs'
import { timeAgo } from '@/utils/format'

interface DocumentEditorProps {
  project: Project
  document: ProjectDocument
  onSave: (content: string) => void
  onCancel: () => void
}

type AiAction = 'generate' | 'readme' | 'api' | null

/** Full document editor: markdown editor, AI assist, export and history. */
export function DocumentEditor({ project, document, onSave, onCancel }: DocumentEditorProps) {
  const [content, setContent] = React.useState(document.content)
  const [dirty, setDirty] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [preview, setPreview] = React.useState(false)
  const [fullscreen, setFullscreen] = React.useState(false)
  const [historyOpen, setHistoryOpen] = React.useState(false)
  const [aiAction, setAiAction] = React.useState<AiAction>(null)
  const [aiMessage, setAiMessage] = React.useState<string | null>(null)

  const handleChange = (value: string) => {
    setContent(value)
    setDirty(value !== document.content)
    setSaved(false)
  }

  const handleSave = () => {
    onSave(content)
    setDirty(false)
    setSaved(true)
  }

  // ── AI-assisted actions (real: POST /api/projects/[slug]/ai/generate) ──
  const runAi = async (action: Exclude<AiAction, null>) => {
    setAiAction(action)
    setAiMessage(null)
    try {
      const kind = action === 'readme' ? 'readme' : action === 'api' ? 'api-docs' : 'doc'
      const response = await fetch(`/api/projects/${project.slug}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, topic: document.title, docType: document.type }),
      })
      if (!response.ok) {
        setAiMessage('AI generation failed — please try again.')
        return
      }
      const result = (await response.json()) as { content: string }
      setContent(result.content)
      setDirty(true)
      setAiMessage(
        action === 'readme'
          ? 'README refreshed from live project state — review and save.'
          : action === 'api'
            ? 'API reference generated from the codebase — review and save.'
            : 'Drafted by the Documenter agent — review and save.',
      )
    } finally {
      setAiAction(null)
    }
  }

  // ── Export ──
  const exportMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = window.document.createElement('a')
    link.href = url
    link.download = document.path.split('/').pop() ?? `${document.title}.md`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`<!doctype html><html><head><title>${document.title}</title>
      <style>
        body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
        h1 { font-size: 1.8rem; } h2 { font-size: 1.35rem; margin-top: 1.4em; } h3 { font-size: 1.15rem; }
        pre { background: #f4f4f5; padding: 12px; border-radius: 6px; overflow-x: auto; font-size: 13px; }
        code { background: #f4f4f5; padding: 1px 4px; border-radius: 4px; font-size: 13px; }
        table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        th, td { border: 1px solid #d4d4d8; padding: 6px 10px; text-align: left; font-size: 14px; }
        blockquote { border-left: 3px solid #d4d4d8; margin: 12px 0; padding-left: 12px; color: #52525b; }
      </style></head><body>`)
    // Render markdown to HTML in-memory.
    const container = printWindow.document.createElement('div')
    printWindow.document.body.appendChild(container)
    container.innerHTML = renderMarkdownToHtml(content)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onCancel} aria-label="Back to documents">
          <ArrowLeft />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{document.title}</h2>
            <DocumentTypeBadge type={document.type} />
            <Badge variant="secondary" className="font-mono text-[10px]">
              v{document.version}
            </Badge>
            {saved && (
              <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Saved
              </span>
            )}
            {dirty && (
              <span className="text-xs text-amber-600 dark:text-amber-400">Unsaved changes</span>
            )}
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
            {document.path} · edited {timeAgo(document.updatedAt)}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* AI assist */}
          <Button
            variant="outline"
            size="sm"
            disabled={aiAction !== null}
            onClick={() => runAi('generate')}
            title="Generate content with the Documenter agent"
          >
            {aiAction === 'generate' ? <Loader2 className="animate-spin" /> : <Wand2 />}
            Generate with AI
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={aiAction !== null}
            onClick={() => runAi('readme')}
            title="Refresh the README from live project state"
          >
            {aiAction === 'readme' ? <Loader2 className="animate-spin" /> : <RefreshCw />}
            Update README
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={aiAction !== null}
            onClick={() => runAi('api')}
            title="Generate API docs from the codebase"
          >
            {aiAction === 'api' ? <Loader2 className="animate-spin" /> : <Sparkles />}
            Generate API Docs
          </Button>
        </div>
      </div>

      {/* AI message */}
      {aiMessage && (
        <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
          {aiMessage}
        </p>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant={preview ? 'outline' : 'default'}
            size="sm"
            onClick={() => setPreview(false)}
          >
            <FileText />
            Edit
          </Button>
          <Button
            variant={preview ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreview(true)}
          >
            <Eye />
            Preview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFullscreen(true)}
            title="Fullscreen preview"
          >
            <Maximize2 />
            Fullscreen
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setHistoryOpen(true)}>
            <History />
            Version History
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <FileDown />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportMarkdown}>
                <Download />
                Export Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPdf}>
                <FileText />
                Export PDF (print)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X />
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!dirty}>
            <Save />
            Save
          </Button>
        </div>
      </div>

      {/* Editor / preview */}
      <div className="rounded-lg border">
        {preview ? (
          <ScrollArea className="h-[560px]">
            <div className="p-6">
              <MarkdownView content={content} />
            </div>
          </ScrollArea>
        ) : (
          <MarkdownEditor
            key={document.id}
            value={content}
            onChange={handleChange}
            placeholder="Write in Markdown…"
            minHeight="520px"
          />
        )}
      </div>

      {/* Dialogs */}
      <VersionHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        versions={document.versions ?? []}
      />

      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>{document.title}</DialogTitle>
            <DialogDescription>{document.path} · rendered preview</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[70vh] rounded-md border p-6">
            <MarkdownView content={content} />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** Minimal markdown → HTML for the print export (headings, code, tables, lists). */
function renderMarkdownToHtml(markdown: string): string {
  const escape = (text: string) =>
    text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const lines = markdown.split('\n')
  const html: string[] = []
  let inCode = false
  let inTable = false
  let tableRows: string[] = []

  const flushTable = () => {
    if (tableRows.length === 0) return
    const header = tableRows[0]
      .split('|')
      .filter(Boolean)
      .map((cell) => `<th>${escape(cell.trim())}</th>`)
      .join('')
    const body = tableRows
      .slice(2)
      .map(
        (row) =>
          `<tr>${row
            .split('|')
            .filter(Boolean)
            .map((cell) => `<td>${escape(cell.trim())}</td>`)
            .join('')}</tr>`,
      )
      .join('')
    html.push(`<table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`)
    tableRows = []
    inTable = false
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('```')) {
      if (inCode) {
        html.push('</pre>')
        inCode = false
      } else {
        flushTable()
        html.push('<pre>')
        inCode = true
      }
      continue
    }
    if (inCode) {
      html.push(escape(line))
      continue
    }
    if (line.startsWith('|') && line.endsWith('|')) {
      if (!inTable) {
        flushTable()
        inTable = true
        tableRows = []
      }
      tableRows.push(line)
      continue
    }
    if (inTable) {
      flushTable()
      inTable = false
    }
    if (line.startsWith('### ')) html.push(`<h3>${escape(line.slice(4))}</h3>`)
    else if (line.startsWith('## ')) html.push(`<h2>${escape(line.slice(3))}</h2>`)
    else if (line.startsWith('# ')) html.push(`<h1>${escape(line.slice(2))}</h1>`)
    else if (line.startsWith('- ')) html.push(`<li>${escape(line.slice(2))}</li>`)
    else if (line.startsWith('> ')) html.push(`<blockquote>${escape(line.slice(2))}</blockquote>`)
    else if (line.trim() === '') html.push('<br/>')
    else html.push(`<p>${escape(line)}</p>`)
  }
  if (inCode) html.push('</pre>')
  if (inTable) flushTable()

  return html.join('\n')
}
