import { z } from 'zod'

import { AGENT_TYPES, MODEL_OPTIONS } from '@/lib/api/agents'

/** Validation schema for the create/edit agent form. */
export const agentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(60, 'Name must be at most 60 characters.'),
  type: z.enum(AGENT_TYPES),
  model: z.enum(MODEL_OPTIONS),
  systemPrompt: z
    .string()
    .trim()
    .min(10, 'System prompt must be at least 10 characters.')
    .max(4000, 'System prompt must be at most 4,000 characters.'),
  tools: z.array(z.string().trim().max(40, 'Tool name is too long.')).max(20),
  mcpIds: z.array(z.string().trim()).max(12),
  scope: z.string().trim().max(200, 'Scope must be at most 200 characters.').optional(),
})

export type AgentFormValues = z.infer<typeof agentFormSchema>
