'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { RAGSourceType } from '@prisma/client'
import { BookMarked, FileText, Globe, Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

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
import { ragSourceSchema, type RagSourceFormValues } from '@/lib/validations/rag'

const TYPE_OPTIONS: Array<{
  value: RAGSourceType
  label: string
  icon: typeof FileText
  hint: string
}> = [
  { value: 'FILE', label: 'File', icon: FileText, hint: 'e.g. README.md, src/lib/db.ts' },
  { value: 'DOCUMENT', label: 'Document', icon: BookMarked, hint: 'e.g. docs/architecture.md' },
  { value: 'URL', label: 'URL', icon: Globe, hint: 'e.g. https://example.com/docs' },
]

const EMPTY_VALUES: RagSourceFormValues = { type: 'FILE', path: '' }

interface AddSourceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RagSourceFormValues) => void
}

/** "Add Source" modal — pick a type, enter the path/address, start indexing. */
export function AddSourceDialog({ open, onOpenChange, onSubmit }: AddSourceDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<RagSourceFormValues>({
    resolver: zodResolver(ragSourceSchema),
    defaultValues: EMPTY_VALUES,
  })

  const type = watch('type')
  const activeOption = TYPE_OPTIONS.find((option) => option.value === type) ?? TYPE_OPTIONS[0]

  React.useEffect(() => {
    if (open) reset(EMPTY_VALUES)
  }, [open, reset])

  async function handleFormSubmit(values: RagSourceFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Source</DialogTitle>
          <DialogDescription>
            Add a file, document or URL to the knowledge base. It will be chunked and indexed
            automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Type */}
          <div className="flex flex-col gap-2">
            <Label>Source type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((option) => {
                    const Icon = option.icon
                    const selected = field.value === option.value
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => field.onChange(option.value)}
                        className={
                          selected
                            ? 'flex flex-col items-center gap-1 rounded-md border border-primary bg-primary/5 px-2 py-3 text-xs font-medium text-primary'
                            : 'flex flex-col items-center gap-1 rounded-md border bg-background px-2 py-3 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        }
                      >
                        <Icon className="size-4" />
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              )}
            />
          </div>

          {/* Path / address */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="rag-path">{type === 'URL' ? 'URL' : 'Path'}</Label>
            <Input
              id="rag-path"
              placeholder={activeOption.hint}
              autoComplete="off"
              {...register('path')}
              aria-invalid={!!errors.path}
            />
            {errors.path && (
              <p className="text-xs font-medium text-destructive">{errors.path.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : null}
              Index Source
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
