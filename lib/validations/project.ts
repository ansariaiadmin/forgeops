import { z } from 'zod'

export const PROJECT_ENVIRONMENTS = ['DEV', 'STAGING', 'PROD'] as const

/** Validation schema for the new/edit project form (React Hook Form + Zod). */
export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(80, 'Name must be at most 80 characters.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters.')
    .max(60, 'Slug must be at most 60 characters.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only.'),
  description: z.string().trim().max(500, 'Description must be at most 500 characters.').optional(),
  environment: z.enum(PROJECT_ENVIRONMENTS),
  techStack: z.array(z.string().trim().max(24, 'Tech name is too long.')).max(20),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>
