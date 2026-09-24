import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { buildSessionCookie, publicUser } from '@/lib/auth-http'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { clientIp, rateLimit } from '@/lib/rate-limit'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * POST /api/auth/register
 * Creates a user (bcrypt-hashed password, default role VIEWER)
 * and returns a JWT + session cookie (auto sign-in).
 * Rate-limited (5 registrations / 10 min per IP).
 */
export async function POST(request: Request) {
  if (!rateLimit(`register:${clientIp(request)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many registrations from this address — try again later.' },
      { status: 429 },
    )
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      name?: string
      email?: string
      password?: string
    } | null

    const name = String(body?.name ?? '').trim()
    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body?.password ?? '')

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters.' }, { status: 400 })
    }
    if (!EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters.' },
        { status: 400 },
      )
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      )
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await hashPassword(password),
        role: 'VIEWER',
      },
    })

    await recordAudit({
      userId: user.id,
      action: 'auth.register',
      resource: `user:${user.id}`,
      details: { email },
      request,
    })

    const { cookie, token } = await buildSessionCookie(user)

    return NextResponse.json(
      {
        success: true,
        user: publicUser(user),
        token,
        expiresIn: 30 * 24 * 60 * 60,
      },
      { status: 201, headers: { 'Set-Cookie': cookie } },
    )
  } catch {
    // Error logged via audit
    // logger.error('[auth:register]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
