import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { MemoryCategory, ProjectMemory } from '@prisma/client'
import { Loader2, Tag } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { MarkdownEditor } from '@/components/projects/detail/tabs/memory/markdown-editor'
import {
  MEMORY_CATEGORIES,
  MEMORY_CATEGORY_META,
} from '@/components/projects/detail/tabs/memory/memory-badges'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { memoryFormSchema, parseTags, type MemoryFormValues } from '@/lib/validations/memory'

interface MemoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this memory; otherwise creates a new one. */
  memory?: ProjectMemory | null
  tags: string[]
  relatedAgentIds: string[]
  relatedMcpIds: string[]
  agents: Array<{ id: string; name: string }>
  mcps: Array<{ id: string; name: string }>
  onSubmit: (
    values: MemoryFormValues & {
      tags: string[]
      relatedAgentId: string | null
      relatedMcpId: string | null
    },
  ) => void
}

const EMPTY_VALUES: MemoryFormValues = { title: '', category: 'ARCHITECTURE', content: '' }

/** Add / edit memory dialog with a markdown editor, tags and relations. */
export function MemoryFormDialog({
  open,
  onOpenChange,
  memory,
  tags,
  relatedAgentIds,
  relatedMcpIds,
  agents,
  mcps,
  onSubmit,
}: MemoryFormDialogProps) {
  const [tagInput, setTagInput] = React.useState('')
  const [tagError, setTagError] = React.useState<string | null>(null)
  const [relatedAgentId, setRelatedAgentId] = React.useState<string>('none')
  const [relatedMcpId, setRelatedMcpId] = React.useState<string>('none')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<MemoryFormValues>({
    resolver: zodResolver(memoryFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const content = watch('content')

  // Reset form when the dialog opens (create vs edit).
  React.useEffect(() => {
    if (open) {
      reset(
        memory
          ? { title: memory.title, category: memory.category, content: memory.content }
          : EMPTY_VALUES,
      )
      setTagInput(memory ? tags.join(', ') : '')
      setTagError(null)
      setRelatedAgentId(relatedAgentIds[0] ?? 'none')
      setRelatedMcpId(relatedMcpIds[0] ?? 'none')
    }
  }, [open, memory, tags, relatedAgentIds, relatedMcpIds, reset])

  function handleAddTag(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return
    event.preventDefault()
    const parsed = parseTags(tagInput)
    if (parsed === null) {
      setTagError('Up to 8 tags, each max 24 characters.')
      return
    }
    setTagError(null)
    setTagInput(parsed.join(', '))
  }

  async function handleFormSubmit(values: MemoryFormValues) {
    const parsed = parseTags(tagInput)
    if (parsed === null) {
      setTagError('Up to 8 tags, each max 24 characters.')
      return
    }
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 350))
    onSubmit({
      ...values,
      tags: parsed,
      relatedAgentId: relatedAgentId === 'none' ? null : relatedAgentId,
      relatedMcpId: relatedMcpId === 'none' ? null : relatedMcpId,
    })
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{memory ? 'Edit memory' : 'Add memory'}</DialogTitle>
          <DialogDescription>
            {memory
              ? 'Update this memory entry.'
              : 'Record knowledge about this project for humans and agents.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-title">Title</Label>
            <Input
              id="memory-title"
              placeholder="e.g. ADR-014: Choose Postgres over MySQL"
              autoComplete="off"
              {...register('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value as MemoryCategory)}
                >
                  <SelectTrigger aria-label="Category" className="w-full sm:w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMORY_CATEGORIES.map((category) => {
                      const meta = MEMORY_CATEGORY_META[category]
                      return (
                        <SelectItem key={category} value={category}>
                          <span className="flex items-center gap-2">
                            <meta.icon className="size-3.5" />
                            {meta.label}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Content (markdown) */}
          <div className="flex flex-col gap-2">
            <Label>Content (Markdown)</Label>
            <div className={cn(errors.content && 'rounded-md ring-1 ring-destructive')}>
              <MarkdownEditor
                key={memory?.id ?? 'new'}
                value={content}
                onChange={(value) => setValue('content', value, { shouldValidate: true })}
                placeholder="Write in Markdown…"
              />
            </div>
            {errors.content && (
              <p className="text-xs font-medium text-destructive">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-tags">Tags</Label>
            <div className="flex flex-wrap items-center gap-1.5">
              <Tag className="size-3.5 text-muted-foreground" />
              <Input
                id="memory-tags"
                placeholder="comma, separated, tags"
                autoComplete="off"
                value={tagInput}
                onChange={(event) => {
                  setTagInput(event.target.value)
                  setTagError(null)
                }}
                onKeyDown={handleAddTag}
                className="h-8 flex-1"
              />
            </div>
            {tagInput && (
              <div className="flex flex-wrap gap-1">
                {parseTags(tagInput)?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {tagError && <p className="text-xs font-medium text-destructive">{tagError}</p>}
          </div>

          {/* Related to */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Related agent</Label>
              <Select value={relatedAgentId} onValueChange={setRelatedAgentId}>
                <SelectTrigger aria-label="Related agent">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Related MCP</Label>
              <Select value={relatedMcpId} onValueChange={setRelatedMcpId}>
                <SelectTrigger aria-label="Related MCP">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {mcps.map((mcp) => (
                    <SelectItem key={mcp.id} value={mcp.id}>
                      {mcp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {memory ? 'Save changes' : 'Add memory'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
