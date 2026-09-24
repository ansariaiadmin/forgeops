import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { agentFormSchema } from '@/lib/validations/agent'

/**
 * GET  /api/projects/[slug]/agents — list agents (project + global)
 * POST /api/projects/[slug]/agents — create an agent
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const agents = await prisma.agent.findMany({
    where: { OR: [{ projectId: project.id }, { projectId: null }] },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ agents })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'agent:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = agentFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const agent = await prisma.agent.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      model: parsed.data.model,
      systemPrompt: parsed.data.systemPrompt,
      tools: parsed.data.tools as Prisma.InputJsonValue,
      mcpIds: parsed.data.mcpIds as Prisma.InputJsonValue,
      projectId: project.id,
      status: 'IDLE',
      totalTokensUsed: 0,
      totalCost: 0,
    },
  })
  return NextResponse.json({ agent }, { status: 201 })
}
