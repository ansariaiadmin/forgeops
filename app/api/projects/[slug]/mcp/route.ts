import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { mcpFormSchema } from '@/lib/validations/mcp'

/**
 * GET  /api/projects/[slug]/mcp — list MCP connections
 * POST /api/projects/[slug]/mcp — create a connection
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const connections = await prisma.mCPConnection.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json({ connections })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'mcp:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = mcpFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const scopes = parsed.data.scopesInput
    ? parsed.data.scopesInput
        .split(',')
        .map((scope) => scope.trim())
        .filter(Boolean)
    : []

  const connection = await prisma.mCPConnection.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      type: parsed.data.type,
      status: 'DISCONNECTED',
      config: JSON.parse(parsed.data.configJson) as Prisma.InputJsonValue,
      allowedTools: parsed.data.allowedTools as Prisma.InputJsonValue,
      scopes: scopes as Prisma.InputJsonValue,
      lastConnectedAt: null,
    },
  })
  return NextResponse.json({ connection }, { status: 201 })
}
