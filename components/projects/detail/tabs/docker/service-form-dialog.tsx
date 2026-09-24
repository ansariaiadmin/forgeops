'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

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
import { serviceFormSchema, type ServiceFormValues } from '@/lib/validations/service'

const EMPTY_VALUES: ServiceFormValues = {
  name: '',
  image: '',
  ports: '',
  volumes: '',
  networks: '',
}

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: ServiceFormValues) => void
}

/** "Add Service" dialog — define a new container for this project. */
export function ServiceFormDialog({ open, onOpenChange, onSubmit }: ServiceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: EMPTY_VALUES,
  })

  React.useEffect(() => {
    if (open) reset(EMPTY_VALUES)
  }, [open, reset])

  async function handleFormSubmit(values: ServiceFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    onSubmit(values)
    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Service</DialogTitle>
          <DialogDescription>
            Define a new Docker service for this project. Ports format:{' '}
            <span className="font-mono text-xs">3000:80</span> or{' '}
            <span className="font-mono text-xs">5432</span> (comma-separated).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              placeholder="e.g. api"
              autoComplete="off"
              {...register('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-xs font-medium text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service-image">Image</Label>
            <Input
              id="service-image"
              placeholder="nginx:1.27-alpine"
              autoComplete="off"
              {...register('image')}
              aria-invalid={!!errors.image}
            />
            {errors.image && (
              <p className="text-xs font-medium text-destructive">{errors.image.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="service-ports">Ports</Label>
            <Input
              id="service-ports"
              placeholder="3000:80, 5432"
              autoComplete="off"
              {...register('ports')}
              aria-invalid={!!errors.ports}
            />
            {errors.ports && (
              <p className="text-xs font-medium text-destructive">{errors.ports.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-volumes">Volumes</Label>
              <Input
                id="service-volumes"
                placeholder="data:/data (optional)"
                autoComplete="off"
                {...register('volumes')}
                aria-invalid={!!errors.volumes}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="service-networks">Networks</Label>
              <Input
                id="service-networks"
                placeholder="forge-net (optional)"
                autoComplete="off"
                {...register('networks')}
                aria-invalid={!!errors.networks}
              />
            </div>
          </div>
          {(errors.volumes || errors.networks) && (
            <p className="text-xs font-medium text-destructive">
              {errors.volumes?.message ?? errors.networks?.message}
            </p>
          )}

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Add Service
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
