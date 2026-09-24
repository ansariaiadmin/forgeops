import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 * Validates the one-time token (hash lookup, expiry, single-use) and
 * replaces the user's password (bcrypt).
 */
export async function POST(request: Request) {
  if (!rateLimit(`reset:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a few minutes.' },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => null)) as {
    token?: string
    password?: string
  } | null

  const token = String(body?.token ?? '')
  const password = String(body?.password ?? '')

  if (token.length < 32) {
    return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } })

  if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 })
  }

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { password: await hashPassword(password), updatedAt: new Date() },
    }),
  ])

  return NextResponse.json({ success: true, message: 'Password updated — you can sign in now.' })
}
