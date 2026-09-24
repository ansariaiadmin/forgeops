'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

/**
 * Client-side route guard (second layer on top of middleware):
 * shows a loader while the session loads and redirects to
 * /auth/login when the user is not authenticated.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useSession()
  const router = useRouter()

  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return <>{children}</>
}
