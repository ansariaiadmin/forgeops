import type { Role } from '@prisma/client'
import { encode } from 'next-auth/jwt'

import { AUTH_SECRET, authCookieName, SESSION_MAX_AGE, useSecureCookies } from '@/lib/auth'

export interface AuthUserShape {
  id: string
  name: string
  email: string
  role: Role
}

const cookieAttributes = `Path=/; HttpOnly; SameSite=Lax${useSecureCookies ? '; Secure' : ''}`

/**
 * Build the NextAuth-compatible session cookie for a user.
 * The JWT is encoded with the same secret/format NextAuth uses, so
 * `/api/auth/session`, middleware and `getSessionUser` all accept it.
 * Returns the cookie header AND the raw JWT (for clients that want it).
 */
export async function buildSessionCookie(
  user: AuthUserShape,
): Promise<{ cookie: string; token: string }> {
  const token = await encode({
    secret: AUTH_SECRET,
    maxAge: SESSION_MAX_AGE,
    token: {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  })

  return {
    cookie: `${authCookieName}=${token}; ${cookieAttributes}; Max-Age=${SESSION_MAX_AGE}`,
    token,
  }
}

/** Cookie header that immediately expires the session cookie. */
export function buildClearSessionCookie(): string {
  return `${authCookieName}=; ${cookieAttributes}; Max-Age=0`
}

/** Strip sensitive fields (password) before returning a user to the client. */
export function publicUser(user: {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}
