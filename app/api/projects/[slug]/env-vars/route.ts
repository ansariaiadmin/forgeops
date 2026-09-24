import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { recordAudit } from '@/lib/audit'
import { getSessionUser } from '@/lib/auth'
import { decrypt, encrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'
import { requirePermission } from '@/lib/guard'

/**
 * GET  /api/projects/[slug]/env-vars — list environment variables
 *      (values decrypted in the response; isSecret values are masked)
 * POST /api/projects/[slug]/env-vars — { key, value, isSecret, environment }
 *      value is encrypted at rest with AES-256-GCM (lib/crypto)
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const variables = await prisma.environmentVariable.findMany({
    where: { projectId: project.id },
    orderBy: { key: 'asc' },
  })

  return NextResponse.json({
    variables: variables.map((variable) => {
      let value: string | null = null
      if (variable.isSecret) {
        value = null // never expose secrets
      } else {
        try {
          value = decrypt(variable.value)
        } catch {
          value = '⚠️ undecryptable'
        }
      }
      return { ...variable, value }
    }),
  })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'service:update')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as {
    key?: string
    value?: string
    isSecret?: boolean
    environment?: string
  } | null

  const key = String(body?.key ?? '').trim()
  const value = String(body?.value ?? '')
  const isSecret = Boolean(body?.isSecret)
  const environment = (body?.environment ?? 'DEV') as 'DEV' | 'STAGING' | 'PROD'

  if (!/^[A-Z][A-Z0-9_]*$/.test(key)) {
    return NextResponse.json(
      { error: 'Key must be uppercase alphanumeric with underscores (e.g. API_KEY).' },
      { status: 400 },
    )
  }
  if (value.length < 1 || value.length > 500) {
    return NextResponse.json({ error: 'Value must be 1–500 characters.' }, { status: 400 })
  }
  if (!['DEV', 'STAGING', 'PROD'].includes(environment)) {
    return NextResponse.json({ error: 'Invalid environment.' }, { status: 400 })
  }

  // Unique per (project, environment, key)
  const existing = await prisma.environmentVariable.findFirst({
    where: { projectId: project.id, environment, key },
  })
  if (existing) {
    return NextResponse.json(
      { error: `"${key}" already exists in ${environment}.` },
      { status: 409 },
    )
  }

  const variable = await prisma.environmentVariable.create({
    data: {
      projectId: project.id,
      key,
      value: encrypt(value), // AES-256-GCM at rest
      isSecret,
      environment,
    },
  })

  await recordAudit({
    userId: user.id,
    projectId: project.id,
    action: 'env.created',
    resource: `env:${key}`,
    details: { environment, isSecret },
    request,
  })

  return NextResponse.json({ variable: { ...variable, value: undefined } }, { status: 201 })
}

export type { Prisma }
