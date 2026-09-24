'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { DocumentType } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

import { MarkdownEditor } from '@/components/projects/detail/tabs/memory/markdown-editor'
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
import { DOC_TYPE_LABEL, DOC_TYPE_OPTIONS } from '@/lib/api/docs'
import { documentFormSchema, type DocumentFormValues } from '@/lib/validations/document'

const EMPTY_VALUES: DocumentFormValues = {
  title: '',
  type: 'GUIDE',
  path: 'docs/',
  content: '',
}

const PATH_PREFIX: Record<DocumentType, string> = {
  README: 'README.md',
  API_DOCS: 'docs/api-',
  ARCHITECTURE: 'docs/',
  GUIDE: 'docs/',
  OTHER: 'docs/',
}

interface NewDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DocumentFormValues) => void
}

/** New document modal: title, type, path and initial markdown content. */
export function NewDocumentDialog({ open, onOpenChange, onSubmit }: NewDocumentDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const type = watch('type')
  const content = watch('content')

  React.useEffect(() => {
    if (open) reset(EMPTY_VALUES)
  }, [open, reset])

  function handleTypeChange(value: DocumentType) {
    setValue('type', value)
    const prefix = PATH_PREFIX[value]
    const path = watch('path')
    if (!path || path === EMPTY_VALUES.path || path.startsWith('docs/')) {
      setValue('path', prefix, { shouldValidate: false })
    }
  }

  async function handleFormSubmit(values: DocumentFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 300))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
          <DialogDescription>Create a markdown document for this project.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="doc-title">Title</Label>
              <Input
                id="doc-title"
                placeholder="e.g. Deployment Guide"
                autoComplete="off"
                {...register('title')}
                aria-invalid={!!errors.title}
              />
              {errors.title && (
                <p className="text-xs font-medium text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label>Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={handleTypeChange}>
                    <SelectTrigger aria-label="Document type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOC_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {DOC_TYPE_LABEL[option]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="doc-path">Path</Label>
            <Input
              id="doc-path"
              placeholder="docs/guide.md"
              autoComplete="off"
              {...register('path')}
              aria-invalid={!!errors.path}
            />
            {errors.path ? (
              <p className="text-xs font-medium text-destructive">{errors.path.message}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground">
                File path inside the project — must end with .md
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Content (Markdown)</Label>
            <MarkdownEditor
              key={`new-${type}`}
              value={content}
              onChange={(value) => setValue('content', value, { shouldValidate: true })}
              placeholder="Write the document in Markdown…"
              minHeight="180px"
            />
            {errors.content && (
              <p className="text-xs font-medium text-destructive">{errors.content.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Create document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
