import { z } from 'zod'

import { DOC_TYPE_OPTIONS } from '@/lib/api/docs'

/** Validation schema for the new document modal. */
export const documentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title must be at most 120 characters.'),
  type: z.enum(DOC_TYPE_OPTIONS),
  path: z
    .string()
    .trim()
    .min(2, 'Path must be at least 2 characters.')
    .max(200, 'Path must be at most 200 characters.')
    .regex(/^[a-zA-Z0-9/._-]+\.md$/, 'Path must end with .md (e.g. docs/guide.md)'),
  content: z
    .string()
    .trim()
    .min(3, 'Content must be at least 3 characters.')
    .max(50000, 'Content must be at most 50,000 characters.'),
})

export type DocumentFormValues = z.infer<typeof documentFormSchema>
