import { PrismaAdapter } from '@auth/prisma-adapter'
import type { Role } from '@prisma/client'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { decode } from 'next-auth/jwt'
import { cookies } from 'next/headers'

import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'

export const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret-change-me'
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days (seconds)

// Mirror NextAuth's cookie naming: secure prefix only on https deployments.
export const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
export const authCookieName = useSecureCookies
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: SESSION_MAX_AGE,
  },
  secret: AUTH_SECRET,
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const email = credentials.email.trim().toLowerCase()
        const user = await prisma.user.findUnique({ where: { email } })

        if (!user?.password) return null
        const isValid = await verifyPassword(credentials.password, user.password)
        if (!isValid) return null

        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, merge the database user into the JWT.
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? token.id ?? ''
        session.user.role = (token.role as Role | undefined) ?? 'VIEWER'
      }
      return session
    },
  },
}

export interface SessionUser {
  id: string
  name: string | null
  email: string | null
  role: Role
}

/**
 * Read the current user from the NextAuth JWT session cookie.
 * Version-independent replacement for `getServerSession` (works with Next 15).
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const tokenValue = cookieStore.get(authCookieName)?.value
  if (!tokenValue) return null

  const decoded = await decode({ token: tokenValue, secret: AUTH_SECRET })
  if (!decoded?.sub) return null

  return {
    id: decoded.sub,
    name: decoded.name ?? null,
    email: decoded.email ?? null,
    role: (decoded.role as Role | undefined) ?? 'VIEWER',
  }
}
