import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/dashboard/stats — real aggregates for the dashboard.
 * Returns project/service/agent counts, average health and today's job stats.
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [
    totalProjects,
    activeProjects,
    runningServices,
    totalServices,
    activeAgents,
    healthAgg,
    jobsToday,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: 'ACTIVE' } }),
    prisma.dockerService.count({ where: { status: 'RUNNING' } }),
    prisma.dockerService.count(),
    prisma.agent.count({ where: { status: 'RUNNING' } }),
    prisma.project.aggregate({ _avg: { healthScore: true } }),
    prisma.agentJob.findMany({
      where: { completedAt: { gte: startOfToday() } },
      select: { status: true },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalProjects,
      activeProjects,
      runningServices,
      totalServices,
      activeAgents,
      avgHealthScore: Math.round(healthAgg._avg.healthScore ?? 0),
      jobsSucceededToday: jobsToday.filter((job) => job.status === 'SUCCESS').length,
      jobsFailedToday: jobsToday.filter((job) => job.status === 'FAILED').length,
    },
  })
}

function startOfToday(): Date {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now
}
