import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { prisma } from '@/lib/prisma'
import { documentFormSchema } from '@/lib/validations/document'

/**
 * GET  /api/projects/[slug]/docs — list documents
 * POST /api/projects/[slug]/docs — create a document (version 1)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const documents = await prisma.document.findMany({
    where: { projectId: project.id },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json({ documents })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'doc:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = documentFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  // One document per file path per project.
  const existing = await prisma.document.findFirst({
    where: { projectId: project.id, path: parsed.data.path },
  })
  if (existing) {
    return NextResponse.json(
      { error: `A document already exists at "${parsed.data.path}".` },
      { status: 409 },
    )
  }

  const document = await prisma.document.create({
    data: {
      projectId: project.id,
      title: parsed.data.title,
      type: parsed.data.type,
      path: parsed.data.path,
      content: parsed.data.content,
      version: 1,
      lastEditedBy: user.id,
    },
  })
  return NextResponse.json({ document }, { status: 201 })
}
