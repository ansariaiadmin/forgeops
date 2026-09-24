'use client'

import { Braces, FileCode2, GitBranch, Sparkles } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ProjectAnalysis } from '@/lib/api/context'
import { techMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const CATEGORY_BADGE: Record<ProjectAnalysis['techStack'][number]['category'], string> = {
  language: 'border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  framework: 'border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400',
  tool: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

interface AnalysisPanelProps {
  analysis: ProjectAnalysis
}

/** Result of "Analyze Project": entry point, APIs, dependencies and stack. */
export function AnalysisPanel({ analysis }: AnalysisPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <CardTitle className="text-base">Project Analysis</CardTitle>
        </div>
        <CardDescription>
          Detected structure at {analysis.analyzedAt.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Tech stack */}
        <div className="space-y-2.5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Tech stack ({analysis.techStack.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {analysis.techStack.map((tech) => {
              const meta = techMeta(tech.name)
              return (
                <span
                  key={tech.name}
                  title={tech.hints.join(' · ')}
                  className="flex items-center gap-2 rounded-lg border bg-background py-1.5 pl-1.5 pr-2.5"
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-md text-[10px] font-semibold',
                      meta.className,
                    )}
                  >
                    {meta.short}
                  </span>
                  <span className="text-xs font-medium">{tech.name}</span>
                  <Badge
                    variant="outline"
                    className={cn('text-[9px]', CATEGORY_BADGE[tech.category])}
                  >
                    {tech.category}
                  </Badge>
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {tech.confidence}%
                  </span>
                </span>
              )
            })}
          </div>
        </div>

        {/* Entry point */}
        <div className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileCode2 className="size-4" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-xs text-muted-foreground">Entry point</p>
            <p className="truncate font-mono text-sm font-medium">
              {analysis.entryPoint ?? 'Not detected'}
            </p>
          </div>
        </div>

        {/* APIs */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Braces className="size-3.5" />
            API routes ({analysis.apis.length})
          </p>
          {analysis.apis.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.apis.map((api) => (
                <span
                  key={api}
                  className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs"
                >
                  {api}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No API routes detected.</p>
          )}
        </div>

        {/* Dependencies */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <GitBranch className="size-3.5" />
            Dependencies ({analysis.dependencies.length})
          </p>
          {analysis.dependencies.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.dependencies.slice(0, 14).map((dep) => (
                <span
                  key={dep}
                  className="rounded-md border px-2 py-1 font-mono text-xs text-muted-foreground"
                >
                  {dep}
                </span>
              ))}
              {analysis.dependencies.length > 14 && (
                <span className="px-1 py-1 text-xs text-muted-foreground">
                  +{analysis.dependencies.length - 14} more
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No dependencies detected.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
