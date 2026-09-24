import { z } from 'zod'

export const MEMORY_CATEGORIES = ['ARCHITECTURE', 'DECISION', 'BUG', 'CONVENTION', 'TODO'] as const

/** Validation schema for the add/edit memory form. */
export const memoryFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, 'Title must be at least 2 characters.')
    .max(120, 'Title must be at most 120 characters.'),
  category: z.enum(MEMORY_CATEGORIES),
  content: z
    .string()
    .trim()
    .min(3, 'Content must be at least 3 characters.')
    .max(20000, 'Content must be at most 20,000 characters.'),
})

export type MemoryFormValues = z.infer<typeof memoryFormSchema>

/** Parse a comma-separated tag input, validating each tag. */
export function parseTags(input: string): string[] | null {
  const tags = input
    .split(',')
    .map((tag) => tag.trim().toLowerCase().replace(/\s+/g, '-'))
    .filter(Boolean)
  if (tags.length > 8) return null
  for (const tag of tags) {
    if (tag.length > 24) return null
  }
  return tags
}
