import { NextResponse } from 'next/server'

import { recordAudit } from '@/lib/audit'
import { buildSessionCookie, publicUser } from '@/lib/auth-http'
import { verifyPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * POST /api/auth/login
 * Verifies email + password (bcrypt) and returns a JWT + session cookie.
 * Rate-limited (10 attempts / 5 min per IP).
 */
export async function POST(request: Request) {
  if (!rateLimit(`login:${clientIp(request)}`, 10, 5 * 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too many attempts — please wait a few minutes.' },
      { status: 429 },
    )
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      email?: string
      password?: string
    } | null

    const email = String(body?.email ?? '')
      .trim()
      .toLowerCase()
    const password = String(body?.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user?.password || !(await verifyPassword(password, user.password))) {
      await recordAudit({
        userId: user?.id ?? null,
        action: 'auth.login_failed',
        resource: 'session',
        details: { email },
        request,
      })
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 })
    }

    const { cookie, token } = await buildSessionCookie(user)

    await recordAudit({
      userId: user.id,
      action: 'auth.login',
      resource: 'session',
      details: { method: 'credentials' },
      request,
    })

    return NextResponse.json(
      {
        success: true,
        user: publicUser(user),
        token,
        expiresIn: 30 * 24 * 60 * 60,
      },
      { status: 200, headers: { 'Set-Cookie': cookie } },
    )
  } catch (error) {
    console.error('[auth:login]', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
