/**
 * LLM layer — runs real OpenAI completions when OPENAI_API_KEY is set,
 * otherwise falls back to deterministic mock responses so the app is fully
 * functional in dev without a key.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LlmResult {
  content: string
  model: string
  tokensUsed: number
  cost: number
}

const COST_PER_1K: Record<string, number> = {
  'gpt-4o': 0.005,
  'gpt-4o-mini': 0.00015,
  'gpt-4': 0.03,
  'claude-3-5-sonnet': 0.003,
  'claude-3-5-haiku': 0.0008,
  'gemini-1.5-pro': 0.00125,
  'gemini-2.0-flash': 0.0001,
  'llama-3.3-70b': 0.0006,
}

/** Rough token estimate: ~4 chars per token. */
export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4))
}

export function estimateCost(model: string, tokens: number): number {
  return Number((((COST_PER_1K[model] ?? 0.001) / 1000) * tokens).toFixed(6))
}

/** True when a real model provider is configured. */
export function hasRealLlm(): boolean {
  return Boolean(process.env.OPENAI_API_KEY)
}

const MOCK_REPLIES = [
  'I reviewed the task and applied the changes. All checks pass — 12 tests green, no regressions detected.',
  'Done. I traced the issue to a missing null-check, fixed it, and added a regression test. The deploy is safe.',
  'I analyzed the request against the project conventions and implemented the minimal change. CI is clean.',
  'Completed with a rollback plan in place. Key files touched: the service layer and its unit tests.',
  'I refactored the module as requested, kept the public API stable, and updated the docs accordingly.',
]

/**
 * Run a completion. With OPENAI_API_KEY set this calls the real API;
 * otherwise returns a deterministic mock (with small delay).
 */
export async function chatCompletion(
  systemPrompt: string,
  userMessage: string,
  model = 'gpt-4o-mini',
): Promise<LlmResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ]

  if (hasRealLlm()) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({ model, messages, temperature: 0.3 }),
    })
    if (!response.ok) {
      throw new Error(`LLM request failed: HTTP ${response.status}`)
    }
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      usage?: { total_tokens?: number }
    }
    const content = data.choices?.[0]?.message?.content ?? ''
    const tokensUsed = data.usage?.total_tokens ?? estimateTokens(userMessage)
    return { content, model, tokensUsed, cost: estimateCost(model, tokensUsed) }
  }

  // Mock fallback — deterministic per input so tests are stable.
  await new Promise((resolve) => setTimeout(resolve, 900 + Math.random() * 600))
  const index =
    (userMessage.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + systemPrompt.length) %
    MOCK_REPLIES.length
  const content = MOCK_REPLIES[index]
  const tokensUsed = estimateTokens(systemPrompt + userMessage) + 80
  return { content, model, tokensUsed, cost: estimateCost(model, tokensUsed) }
}
