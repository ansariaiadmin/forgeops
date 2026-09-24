'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Project } from '@prisma/client'
import { Check, Loader2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { projectFormSchema, type ProjectFormValues } from '@/lib/validations/project'
import { TECH_OPTIONS } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { slugify } from '@/utils/slug'

interface ProjectFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, the dialog edits this project; otherwise it creates a new one. */
  project?: Project | null
  onSubmit: (values: ProjectFormValues) => void
}

const EMPTY_VALUES: ProjectFormValues = {
  name: '',
  slug: '',
  description: '',
  environment: 'DEV',
  techStack: [],
}

function toFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    slug: project.slug,
    description: project.description ?? '',
    environment: project.environment,
    techStack: Array.isArray(project.techStack) ? (project.techStack as string[]) : [],
  }
}

/**
 * New / edit project dialog. Validated with React Hook Form + Zod.
 * The slug auto-generates from the name until the user edits it manually.
 */
export function ProjectFormDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
}: ProjectFormDialogProps) {
  const slugTouched = React.useRef(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  const techStack = watch('techStack')
  const name = watch('name')

  // Reset the form every time the dialog opens (create vs edit mode).
  React.useEffect(() => {
    if (open) {
      slugTouched.current = !!project
      reset(project ? toFormValues(project) : EMPTY_VALUES)
    }
  }, [open, project, reset])

  function handleNameChange(value: string) {
    setValue('name', value, { shouldValidate: true })
    // Auto-generate the slug from the name until the user edits it manually.
    if (!slugTouched.current) {
      setValue('slug', slugify(value), { shouldValidate: false })
    }
  }

  function handleSlugChange(value: string) {
    slugTouched.current = true
    setValue('slug', value, { shouldValidate: true })
  }

  function toggleTech(tech: string) {
    const next = techStack.includes(tech)
      ? techStack.filter((item) => item !== tech)
      : [...techStack, tech]
    setValue('techStack', next, { shouldValidate: true })
  }

  async function handleFormSubmit(values: ProjectFormValues) {
    setIsSubmitting(true)
    // Simulate a short API round-trip before handing off.
    await new Promise((resolve) => setTimeout(resolve, 400))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{project ? 'Edit project' : 'New project'}</DialogTitle>
          <DialogDescription>
            {project
              ? 'Update the details of this project.'
              : 'Create a new project in your workspace.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="e.g. api-gateway"
              autoComplete="off"
              {...register('name')}
              onChange={(event) => handleNameChange(event.target.value)}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              id="project-slug"
              placeholder="api-gateway"
              autoComplete="off"
              {...register('slug')}
              onChange={(event) => handleSlugChange(event.target.value)}
              aria-invalid={!!errors.slug}
            />
            {errors.slug ? (
              <p className="text-xs font-medium text-destructive">{errors.slug.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Auto-generated from the name{name && <span> — /{slugify(name)}</span>}. You can
                override it.
              </p>
            )}
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              placeholder="What does this project do?"
              rows={3}
              {...register('description')}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-xs font-medium text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Environment */}
          <div className="flex flex-col gap-2">
            <Label>Environment</Label>
            <Controller
              control={control}
              name="environment"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Environment">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DEV">Dev</SelectItem>
                    <SelectItem value="STAGING">Staging</SelectItem>
                    <SelectItem value="PROD">Prod</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Tech stack */}
          <div className="flex flex-col gap-2">
            <Label>Tech stack</Label>
            <div className="flex flex-wrap gap-1.5">
              {TECH_OPTIONS.map((tech) => {
                const selected = techStack.includes(tech)
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTech(tech)}
                    className={cn(
                      'flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    {selected && <Check className="size-3" />}
                    {tech}
                  </button>
                )
              })}
            </div>
            {errors.techStack && (
              <p className="text-xs font-medium text-destructive">{errors.techStack.message}</p>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              {project ? 'Save changes' : 'Create project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
