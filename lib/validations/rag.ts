import { z } from 'zod'

export const RAG_SOURCE_TYPES = ['FILE', 'DOCUMENT', 'URL'] as const

/** Validation schema for the "Add Source" modal (React Hook Form + Zod). */
export const ragSourceSchema = z
  .object({
    type: z.enum(RAG_SOURCE_TYPES),
    path: z
      .string()
      .trim()
      .min(3, 'Path or address must be at least 3 characters.')
      .max(300, 'Path must be at most 300 characters.'),
  })
  .refine((value) => value.type !== 'URL' || /^https?:\/\//.test(value.path), {
    message: 'URL must start with http:// or https://',
    path: ['path'],
  })

export type RagSourceFormValues = z.infer<typeof ragSourceSchema>
