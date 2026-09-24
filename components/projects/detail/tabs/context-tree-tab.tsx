'use client'

import * as React from 'react'
import type { Project } from '@prisma/client'
import { FileText, Loader2, PackageOpen, Search, Sparkles } from 'lucide-react'

import { AnalysisPanel } from '@/components/projects/detail/tabs/context/analysis-panel'
import { ContextPackDialog } from '@/components/projects/detail/tabs/context/context-pack-dialog'
import { ContextTree } from '@/components/projects/detail/tabs/context/context-tree'
import { FilePreview } from '@/components/projects/detail/tabs/context/file-preview'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  analyzeProject,
  buildContextPack,
  detectLanguage,
  getContextTree,
  getProjectContents,
  type ContextPack,
  type ContextNode,
  type FileContent,
  type ProjectAnalysis,
} from '@/lib/api/context'
import { techMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface ContextTreeTabProps {
  project: Project
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** 📁 Context tree: file explorer, preview, tech detection, analysis and search. */
export function ContextTreeTab({ project }: ContextTreeTabProps) {
  const [tree, setTree] = React.useState<ContextNode[] | null>(null)
  const [contents, setContents] = React.useState<Record<string, string | null>>({})
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState('')

  const [analyzing, setAnalyzing] = React.useState(false)
  const [analysis, setAnalysis] = React.useState<ProjectAnalysis | null>(null)
  const [pack, setPack] = React.useState<ContextPack | null>(null)
  const [packing, setPacking] = React.useState(false)

  // ── load tree + contents (mock; later: GET /api/projects/[slug]/context) ──
  React.useEffect(() => {
    let cancelled = false
    async function load() {
      const [treeNodes, fileContents] = await Promise.all([
        getContextTree(project.id),
        getContextTree(project.id).then((nodes) => getProjectContents(nodes)),
      ])
      if (cancelled) return
      setTree(treeNodes)
      setContents(fileContents)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [project.id])

  // Auto-open the README on first load for an immediate preview.
  React.useEffect(() => {
    if (!selectedPath && tree) {
      const readme = tree.find((node) => node.path === 'README.md')
      if (readme) setSelectedPath('README.md')
    }
  }, [tree, selectedPath])

  const selectedContent = selectedPath ? contents[selectedPath] : undefined
  const selectedFile: FileContent | null =
    selectedPath && selectedContent != null
      ? {
          path: selectedPath,
          language: detectLanguage(selectedPath),
          content: selectedContent,
          size: new Blob([selectedContent]).size,
          lines: selectedContent.split('\n').length,
        }
      : null

  // Auto-detected stack (feature 3) — computed from the tree + package.json.
  const detectedStack = React.useMemo(() => {
    if (!tree) return []
    return analyzeProject(project, tree, contents).techStack
  }, [tree, contents, project])

  async function handleAnalyze() {
    if (!tree) return
    setAnalyzing(true)
    await delay(900)
    setAnalysis(analyzeProject(project, tree, contents))
    setAnalyzing(false)
  }

  async function handlePack() {
    if (!tree) return
    setPacking(true)
    await delay(700)
    setPack(buildContextPack(project.name, tree, contents))
    setPacking(false)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-52 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search files and folders..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handlePack} disabled={packing || !tree}>
          {packing ? <Loader2 className="animate-spin" /> : <PackageOpen />}
          Generate Context Pack
        </Button>
        <Button size="sm" onClick={handleAnalyze} disabled={analyzing || !tree}>
          {analyzing ? <Loader2 className="animate-spin" /> : <Sparkles />}
          Analyze Project
        </Button>
      </div>

      {/* Detected stack strip */}
      {detectedStack.length > 0 && (
        <Card className="py-0">
          <CardContent className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Detected stack
            </span>
            {detectedStack.map((tech) => {
              const meta = techMeta(tech.name)
              return (
                <span
                  key={tech.name}
                  title={tech.hints.join(' · ')}
                  className="flex items-center gap-1.5 rounded-md border bg-background py-1 pl-1 pr-2"
                >
                  <span
                    className={cn(
                      'flex size-4.5 items-center justify-center rounded text-[8px] font-semibold',
                      meta.className,
                    )}
                  >
                    {meta.short}
                  </span>
                  <span className="text-[11px] font-medium">{tech.name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {tech.confidence}%
                  </span>
                </span>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Analysis result */}
      {analysis && <AnalysisPanel analysis={analysis} />}

      {/* Tree + Preview */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        {/* Tree */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-base">Context Tree</CardTitle>
              <CardDescription>{project.name} · file structure</CardDescription>
            </div>
            {tree && (
              <Badge variant="secondary" className="font-mono text-[10px]">
                {countFiles(tree)} files
              </Badge>
            )}
          </CardHeader>
          <CardContent className="pt-0">
            {tree ? (
              <ContextTree nodes={tree} search={search} onSelect={setSelectedPath} />
            ) : (
              <div className="space-y-2 p-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b pb-3">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <p className="truncate font-mono text-sm font-medium">
                {selectedFile?.path ?? 'Select a file'}
              </p>
            </div>
            {selectedFile && (
              <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {selectedFile.language}
                </Badge>
                <span>{selectedFile.lines} lines</span>
                <span>{formatBytes(selectedFile.size)}</span>
              </div>
            )}
          </CardHeader>
          <div className="h-[560px]">
            <FilePreview file={selectedFile} />
          </div>
        </Card>
      </div>

      <ContextPackDialog pack={pack} onOpenChange={(open) => !open && setPack(null)} />
    </div>
  )
}

function countFiles(nodes: ContextNode[]): number {
  return nodes.reduce(
    (acc, node) => acc + (node.type === 'file' ? 1 : node.children ? countFiles(node.children) : 0),
    0,
  )
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${(bytes / 1024).toFixed(1)} KB`
}
