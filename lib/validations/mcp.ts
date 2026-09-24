import { z } from 'zod'

import { MCP_TYPE_OPTIONS } from '@/lib/api/mcp'

/** Validation schema for the add/edit MCP connection form. */
export const mcpFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(40, 'Name must be at most 40 characters.'),
  type: z.enum(MCP_TYPE_OPTIONS),
  /** Raw JSON text — must parse to a JSON object. */
  configJson: z
    .string()
    .trim()
    .min(2, 'Config must be a JSON object.')
    .refine(
      (value) => {
        try {
          const parsed = JSON.parse(value)
          return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        } catch {
          return false
        }
      },
      { message: 'Config must be valid JSON object, e.g. {"repo": "org/name"}' },
    ),
  allowedTools: z.array(z.string().trim().max(40, 'Tool name is too long.')).max(20),
  scopesInput: z.string().trim().max(200, 'Scopes must be at most 200 characters.'),
})

export type McpFormValues = z.infer<typeof mcpFormSchema>

/** Parse a comma-separated scopes input. */
export function parseScopes(input: string): string[] {
  return input
    .split(',')
    .map((scope) => scope.trim().toLowerCase())
    .filter(Boolean)
}
