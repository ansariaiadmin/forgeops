'use client'

import * as React from 'react'
import { Tree, type NodeRendererProps } from 'react-arborist'
import {
  ChevronDown,
  File,
  FileCode2,
  FileCog,
  FileJson,
  FileKey2,
  FileText,
  Folder,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react'

import type { ContextNode } from '@/lib/api/context'
import { cn } from '@/lib/utils'

export type ContextTreeItem = ContextNode & { id: string }

const FILE_ICONS: Array<{ test: RegExp | string; icon: LucideIcon; className: string }> = [
  { test: /\.md$/, icon: FileText, className: 'text-sky-500' },
  { test: /\.json$/, icon: FileJson, className: 'text-amber-500' },
  { test: /\.(ts|tsx|js|jsx|css|scss|go|py|rs)$/, icon: FileCode2, className: 'text-blue-500' },
  { test: /\.(ya?ml|toml)$/, icon: FileCog, className: 'text-zinc-500' },
  { test: 'Dockerfile', icon: FileCog, className: 'text-sky-500' },
  { test: /^\.env/, icon: FileKey2, className: 'text-rose-500' },
  { test: '.gitignore', icon: FileCog, className: 'text-muted-foreground' },
]

function fileIcon(name: string): { icon: LucideIcon; className: string } {
  for (const entry of FILE_ICONS) {
    if (typeof entry.test === 'string' ? name === entry.test : entry.test.test(name)) {
      return { icon: entry.icon, className: entry.className }
    }
  }
  return { icon: File, className: 'text-muted-foreground' }
}

function ContextNodeRow({ node, style, dragHandle }: NodeRendererProps<ContextTreeItem>) {
  const { name, type, important } = node.data
  const isDir = type === 'dir'
  const { icon: Icon, className } = fileIcon(name)

  return (
    <div
      ref={dragHandle}
      style={style}
      onClick={() => (isDir ? node.toggle() : node.select())}
      className={cn(
        'group flex cursor-pointer items-center gap-1.5 pr-2 text-sm',
        node.isSelected
          ? 'bg-accent text-accent-foreground'
          : important
            ? 'bg-amber-500/10 text-foreground'
            : 'text-foreground hover:bg-accent/50',
      )}
    >
      {isDir ? (
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            !node.isOpen && '-rotate-90',
          )}
        />
      ) : (
        <span className="w-3.5 shrink-0" />
      )}
      {isDir ? (
        node.isOpen ? (
          <FolderOpen className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <Folder className="size-4 shrink-0 text-muted-foreground" />
        )
      ) : (
        <Icon className={cn('size-4 shrink-0', className)} />
      )}
      <span className={cn('truncate', important && 'font-medium')}>{name}</span>
      {important && (
        <span
          className="ml-auto size-1.5 shrink-0 rounded-full bg-amber-500"
          title="Important file"
        />
      )}
    </div>
  )
}

function useElementSize<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null)
  const [size, setSize] = React.useState({ width: 0, height: 0 })

  React.useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setSize({ width, height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, ...size }
}

interface ContextTreeProps {
  nodes: ContextNode[]
  search: string
  onSelect: (path: string) => void
}

/** File/folder tree powered by react-arborist. */
export function ContextTree({ nodes, search, onSelect }: ContextTreeProps) {
  const { ref, width, height } = useElementSize<HTMLDivElement>()

  const data = React.useMemo<ContextTreeItem[]>(() => toTreeItems(nodes), [nodes])

  return (
    <div ref={ref} className="h-[540px] w-full">
      <Tree<ContextTreeItem>
        data={data}
        openByDefault={false}
        initialOpenState={{ src: true, tests: true, docs: true }}
        rowHeight={26}
        width={width || 620}
        height={height || 540}
        indent={14}
        disableDrag
        disableDrop
        disableEdit
        searchTerm={search || undefined}
        searchMatch={(node, term) => node.data.name.toLowerCase().includes(term.toLowerCase())}
        onSelect={(selected) => {
          const node = selected[0]
          if (node?.isLeaf) onSelect(node.data.path)
        }}
        className="text-sm"
      >
        {ContextNodeRow}
      </Tree>
    </div>
  )
}

function toTreeItems(nodes: ContextNode[]): ContextTreeItem[] {
  return nodes.map((node) => ({
    ...node,
    id: node.path,
    children: node.children ? toTreeItems(node.children) : undefined,
  }))
}
