'use client'

import * as React from 'react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

/**
 * Wraps the app in NextAuth's session context so client components
 * (forms, ProtectedRoute, header) can read the session.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
