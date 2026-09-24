import { NextResponse } from 'next/server'

import { buildClearSessionCookie } from '@/lib/auth-http'

/**
 * POST /api/auth/logout
 * Expires the NextAuth session cookie.
 */
export async function POST() {
  return NextResponse.json(
    { success: true },
    { headers: { 'Set-Cookie': buildClearSessionCookie() } },
  )
}
