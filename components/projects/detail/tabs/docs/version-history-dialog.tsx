'use client'

import * as React from 'react'
import type { DocVersion } from '@/lib/api/docs'

import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { formatDate } from '@/utils/format'

interface VersionHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  versions: DocVersion[]
}

/** Version history with a line diff between consecutive versions. */
export function VersionHistoryDialog({ open, onOpenChange, versions }: VersionHistoryDialogProps) {
  const [selected, setSelected] = React.useState<number | null>(null)

  React.useEffect(() => {
    if (open) setSelected(versions[0]?.version ?? null)
  }, [open, versions])

  const current = versions.find((v) => v.version === selected)
  const previous = current ? versions.find((v) => v.version === current.version - 1) : undefined

  const diffLines = React.useMemo(() => {
    if (!current || !previous) return null
    return computeLineDiff(previous.content, current.content)
  }, [current, previous])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Version History</DialogTitle>
          <DialogDescription>
            {versions.length} versions · select one to see what changed vs the previous version.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[180px_1fr]">
          {/* Version list */}
          <ScrollArea className="h-72 rounded-md border">
            <div className="divide-y">
              {versions.map((version) => (
                <button
                  key={version.version}
                  type="button"
                  onClick={() => setSelected(version.version)}
                  className={cn(
                    'w-full px-3 py-2 text-left transition-colors',
                    selected === version.version
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold">v{version.version}</span>
                    {version.version === 1 && (
                      <Badge variant="secondary" className="font-mono text-[9px]">
                        initial
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{version.summary}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {version.author} · {formatDate(version.at)}
                  </p>
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Diff */}
          <div className="min-w-0 space-y-2">
            {current && (
              <p className="text-xs text-muted-foreground">
                Changes in{' '}
                <span className="font-mono font-medium text-foreground">v{current.version}</span>
                {previous ? (
                  <>
                    {' '}
                    vs{' '}
                    <span className="font-mono font-medium text-foreground">
                      v{previous.version}
                    </span>
                  </>
                ) : (
                  ' — initial version'
                )}
              </p>
            )}
            {diffLines ? (
              <ScrollArea className="h-72 rounded-md border bg-muted/20 p-3">
                <div className="space-y-0 font-mono text-[11px] leading-5">
                  {diffLines.map((line, index) => (
                    <div
                      key={index}
                      className={cn(
                        'whitespace-pre-wrap break-all rounded-sm px-1.5',
                        line.type === 'add' &&
                          'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                        line.type === 'remove' && 'bg-red-500/10 text-red-700 dark:text-red-300',
                        line.type === 'same' && 'text-muted-foreground',
                      )}
                    >
                      {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                      {line.text}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <ScrollArea className="h-72 rounded-md border bg-muted/20 p-3">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-5 text-muted-foreground">
                  {current?.content}
                </pre>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface DiffLine {
  type: 'add' | 'remove' | 'same'
  text: string
}

/** Simple line-level diff (no external dependency) — marks added/removed lines. */
function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')

  // LCS over lines — classic dynamic programming on the line arrays.
  const n = oldLines.length
  const m = newLines.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] =
        oldLines[i] === newLines[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (oldLines[i] === newLines[j]) {
      result.push({ type: 'same', text: oldLines[i] })
      i += 1
      j += 1
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'remove', text: oldLines[i] })
      i += 1
    } else {
      result.push({ type: 'add', text: newLines[j] })
      j += 1
    }
  }
  while (i < n) {
    result.push({ type: 'remove', text: oldLines[i] })
    i += 1
  }
  while (j < m) {
    result.push({ type: 'add', text: newLines[j] })
    j += 1
  }
  return result
}
