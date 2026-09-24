import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { parsePortsInput } from '@/lib/api/docker'
import { prisma } from '@/lib/prisma'
import { serviceFormSchema } from '@/lib/validations/service'

/**
 * GET  /api/projects/[slug]/services — list a project's Docker services
 * POST /api/projects/[slug]/services — define a new service
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const services = await prisma.dockerService.findMany({
    where: { projectId: project.id },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ services })
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'service:create')
  if (denied) return denied

  const { slug } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as unknown
  const parsed = serviceFormSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.flatten() },
      { status: 400 },
    )
  }

  const service = await prisma.dockerService.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      image: parsed.data.image,
      ports: parsePortsInput(parsed.data.ports ?? '') as Prisma.InputJsonValue,
      volumes: (parsed.data.volumes ?? '')
        .split(',')
        .map((volume) => volume.trim())
        .filter(Boolean) as Prisma.InputJsonValue,
      networks: (parsed.data.networks ?? '')
        .split(',')
        .map((network) => network.trim())
        .filter(Boolean) as Prisma.InputJsonValue,
      status: 'STOPPED',
      healthStatus: 'stopped',
      containerId: '',
    },
  })
  return NextResponse.json({ service }, { status: 201 })
}
