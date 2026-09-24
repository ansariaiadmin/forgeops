import { NextResponse } from 'next/server'

import { prisma } from '@/lib/prisma'

/**
 * GET /api/health/live — unauthenticated liveness probe (used by the
 * Docker HEALTHCHECK). Verifies the server AND the database connection.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'ok', db: 'up' })
  } catch {
    return NextResponse.json({ status: 'degraded', db: 'down' }, { status: 503 })
  }
}
