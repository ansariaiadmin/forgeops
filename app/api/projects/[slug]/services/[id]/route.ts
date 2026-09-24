import { NextResponse } from 'next/server'
import type { ServiceStatus } from '@prisma/client'

import { getSessionUser } from '@/lib/auth'
import { requirePermission } from '@/lib/guard'
import { recordAudit } from '@/lib/audit'
import { prisma } from '@/lib/prisma'

const ACTION_TO_STATUS: Record<string, ServiceStatus> = {
  start: 'RUNNING',
  stop: 'STOPPED',
  restart: 'RUNNING',
}

/**
 * POST /api/projects/[slug]/services/[id]
 * Body: { action: "start" | "stop" | "restart" | "delete" }
 * start/stop/restart update the service status (and health when stopped);
 * delete removes the service entirely.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const denied = requirePermission(user, 'service:create')
  if (denied) return denied

  const { slug, id } = await params
  const project = await prisma.project.findFirst({ where: { slug } })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const service = await prisma.dockerService.findFirst({
    where: { id, projectId: project.id },
  })
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  const body = (await request.json().catch(() => null)) as { action?: string } | null
  const action = body?.action

  if (action === 'delete') {
    await prisma.dockerService.delete({ where: { id: service.id } })
    await recordAudit({
      userId: user.id,
      projectId: service.projectId,
      action: 'service.deleted',
      resource: `service:${service.name}`,
      request,
    })
    return NextResponse.json({ success: true })
  }

  if (!action || !(action in ACTION_TO_STATUS)) {
    return NextResponse.json(
      { error: 'Invalid action — use "start", "stop", "restart" or "delete".' },
      { status: 400 },
    )
  }

  const status = ACTION_TO_STATUS[action]
  const updated = await prisma.dockerService.update({
    where: { id: service.id },
    data: {
      status,
      healthStatus: status === 'STOPPED' ? 'stopped' : 'healthy',
      updatedAt: new Date(),
    },
  })
  await recordAudit({
    userId: user.id,
    projectId: service.projectId,
    action: `service.${action}`,
    resource: `service:${service.name}`,
    details: { status },
    request,
  })
  return NextResponse.json({ service: updated })
}
