import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { recordAudit } from '@/lib/audit'
import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { chatCompletion } from '@/lib/llm'
import { prisma } from '@/lib/prisma'
import { agentFormSchema } from '@/lib/validations/agent'

/**
 * PATCH  /api/projects/[slug]/agents/[id] — update agent fields
 * POST   /api/projects/[slug]/agents/[id] — { action: "run" | "stop" | "delete" }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'agent:update')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.agent.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = agentFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const agent = await prisma.agent.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      model: parsed.data.model,
      systemPrompt: parsed.data.systemPrompt,
      tools: parsed.data.tools as Prisma.InputJsonValue,
      mcpIds: parsed.data.mcpIds as Prisma.InputJsonValue,
      updatedAt: new Date(),
    },
  })
  return NextResponse.json({ agent })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'agent:create')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.agent.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as {
    action?: string
    task?: string
  } | null
  const action = body?.action

  if (action === 'delete') {
    await prisma.agent.delete({ where: { id } })
    await recordAudit({
      userId: user.id,
      projectId: existing.projectId,
      action: 'agent.deleted',
      resource: `agent:${existing.name}`,
      request,
    })
    return NextResponse.json({ success: true })
  }

  if (action === 'stop') {
    const agent = await prisma.agent.update({
      where: { id },
      data: { status: 'IDLE', updatedAt: new Date() },
    })
    return NextResponse.json({ agent })
  }

  if (action === 'run') {
    const task = String(body?.task ?? '').trim()
    const startedAt = new Date()

    // Mark the agent busy and create the job (queued → running).
    await prisma.agent.update({
      where: { id },
      data: { status: 'RUNNING', updatedAt: startedAt },
    })
    const job = await prisma.agentJob.create({
      data: {
        agentId: existing.id,
        projectId: existing.projectId ?? 'proj-core',
        task: task || `Routine task for ${existing.name}`,
        status: 'RUNNING',
        startedAt,
      },
    })

    // Execute via the LLM layer (real model with OPENAI_API_KEY, mock otherwise).
    let result: string
    let error: string | null = null
    let tokensUsed = 0
    let cost = 0
    try {
      const completion = await chatCompletion(
        existing.systemPrompt,
        task || 'Summarize what you can do for this project.',
        existing.model,
      )
      result = completion.content
      tokensUsed = completion.tokensUsed
      cost = completion.cost
    } catch (cause) {
      result = ''
      error = cause instanceof Error ? cause.message : 'LLM execution failed'
    }

    const completedAt = new Date()
    const finalJob = await prisma.agentJob.update({
      where: { id: job.id },
      data: {
        status: error ? 'FAILED' : 'SUCCESS',
        result: result || null,
        error,
        tokensUsed,
        cost,
        completedAt,
      },
    })
    const agent = await prisma.agent.update({
      where: { id },
      data: {
        status: 'IDLE',
        totalTokensUsed: { increment: tokensUsed },
        totalCost: { increment: cost },
        updatedAt: completedAt,
      },
    })

    await recordAudit({
      userId: user.id,
      projectId: existing.projectId,
      action: error ? 'agent.job_failed' : 'agent.job_completed',
      resource: `agent:${existing.name}`,
      details: { jobId: job.id, tokensUsed, cost },
      request,
    })

    return NextResponse.json({ agent, job: finalJob })
  }

  return NextResponse.json(
    { error: 'Invalid action — use "run", "stop" or "delete".' },
    { status: 400 },
  )
}
