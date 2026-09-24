import { createHash, randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'

import { clientIp, rateLimit } from '@/lib/rate-limit'
import { prisma } from '@/lib/prisma'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/forgot-password
 * Creates a one-time reset token (sha256-hashed in DB, expires in 30 min).
 * Always returns 200 to avoid user enumeration. In dev the reset link is
 * logged; in production it would go out via an email provider (Resend/SES).
 */
export async function POST(request: Request) {
  if (!rateLimit(`forgot:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many requests — try again in a few minutes.' },
      { status: 429 },
    )
  }

  const body = (await request.json().catch(() => null)) as { email?: string } | null
  const email = String(body?.email ?? '')
    .trim()
    .toLowerCase()

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    })

    // Dev delivery: log the link. Production: send via email provider.
    console.log(`[auth] password reset link for ${email}: /auth/reset-password?token=${token}`)
  }

  // Generic response regardless of whether the account exists.
  return NextResponse.json({
    success: true,
    message:
      'If an account exists for that email, a reset link has been sent. It expires in 30 minutes.',
  })
}
