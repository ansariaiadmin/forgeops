import { z } from 'zod'

/** Validation schema for the "Add Service" form (React Hook Form + Zod). */
export const serviceFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must be at most 60 characters.')
    .regex(
      /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/,
      'Use lowercase letters, numbers, hyphens or underscores.',
    ),
  image: z
    .string()
    .trim()
    .min(2, 'Image must be at least 2 characters.')
    .regex(
      /^[a-zA-Z0-9][a-zA-Z0-9._/-]*:[a-zA-Z0-9._-]+$/,
      'Use image:tag format, e.g. nginx:1.27-alpine',
    ),
  ports: z.string().trim().max(200, 'Ports list is too long.').optional(),
  volumes: z.string().trim().max(300, 'Volumes list is too long.').optional(),
  networks: z.string().trim().max(200, 'Networks list is too long.').optional(),
})

export type ServiceFormValues = z.infer<typeof serviceFormSchema>
