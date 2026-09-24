import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import type { RAGSourceType } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { generateChunks } from '@/lib/api/rag'
import { embedTexts } from '@/lib/embeddings'
import { prisma } from '@/lib/prisma'
import { ragSourceSchema } from '@/lib/validations/rag'

/**
 * GET  /api/projects/[slug]/rag/sources — list RAG sources
 * POST /api/projects/[slug]/rag/sources — add + index a source
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const sources = await prisma.rAGSource.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ sources })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'rag:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = ragSourceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const source = await prisma.rAGSource.create({
    data: {
      projectId: project.id,
      type: parsed.data.type,
      path: parsed.data.path,
      isIndexed: true,
      lastIndexedAt: new Date(),
      chunks: generateChunks('', parsed.data.type, parsed.data.path).map(
        (chunk) => chunk.text,
      ) as Prisma.InputJsonValue,
      embeddings: (await embedChunks(parsed.data.type, parsed.data.path)) as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ source }, { status: 201 })
}

async function embedChunks(type: RAGSourceType, path: string): Promise<number[][]> {
  const texts = generateChunks('', type, path).map((chunk) => chunk.text)
  return embedTexts(texts)
}
