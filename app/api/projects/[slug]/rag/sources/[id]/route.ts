import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import type { RAGSourceType } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { generateChunks } from '@/lib/api/rag'
import { embedTexts } from '@/lib/embeddings'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/projects/[slug]/rag/sources/[id]
 * Body: { action: "reindex" | "delete" }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'rag:create')
  if (denied) return denied

  const { id } = await params
  const existing = await prisma.rAGSource.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Source not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action

  if (action === 'delete') {
    await prisma.rAGSource.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }

  if (action === 'reindex') {
    const source = await prisma.rAGSource.update({
      where: { id },
      data: {
        isIndexed: true,
        lastIndexedAt: new Date(),
        chunks: generateChunks(id, existing.type, existing.path).map(
          (chunk) => chunk.text,
        ) as Prisma.InputJsonValue,
        embeddings: (await embedChunks(existing.type, existing.path)) as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    })
    return NextResponse.json({ source })
  }

  return NextResponse.json(
    { error: 'Invalid action — use "reindex" or "delete".' },
    { status: 400 },
  )
}

async function embedChunks(type: RAGSourceType, path: string): Promise<number[][]> {
  const texts = generateChunks('', type, path).map((chunk) => chunk.text)
  return embedTexts(texts)
}
