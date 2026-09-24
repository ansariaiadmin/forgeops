import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { getSessionUser } from '@/lib/auth'
import { chatCompletion } from '@/lib/llm'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/projects/[slug]/ai/generate
 * Body: { kind: "doc" | "readme" | "api-docs", topic?, docType? }
 * Runs the Documenter agent through the LLM layer (real model with
 * OPENAI_API_KEY, deterministic mock otherwise).
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as {
    kind?: string
    topic?: string
    docType?: string
  } | null
  const kind = body?.kind ?? 'doc'

  const systemPrompt = [
    'You are the Documenter agent for the ForgeOps platform.',
    'Write concise, accurate Markdown documentation for the given project.',
    'Use headings, lists and tables. Never invent facts — mark unknowns as TODO.',
    `Project: ${project.name}. Environment: ${project.environment}.`,
  ].join('\n')

  let userMessage: string
  switch (kind) {
    case 'readme':
      userMessage = `Update the README for ${project.name} (${project.description ?? 'no description'}). Include a features section, quick start, and a tech stack table.`
      break
    case 'api-docs':
      userMessage = `Generate an API reference for ${project.name}. Include endpoint tables, request envelopes and an error code table.`
      break
    default:
      userMessage = `Write a ${body?.docType ?? 'guide'} document about: ${body?.topic ?? project.name}.`
  }

  const completion = await chatCompletion(systemPrompt, userMessage, 'gpt-4o-mini')

  await recordAudit({
    userId: user.id,
    projectId: project.id,
    action: `ai.generate_${kind}`,
    resource: `project:${project.slug}`,
    details: { topic: body?.topic, tokens: completion.tokensUsed },
    request,
  })

  return NextResponse.json({ content: completion.content, message: completion.content })
}
