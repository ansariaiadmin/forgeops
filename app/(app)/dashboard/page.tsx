import { redirect } from 'next/navigation'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { getSessionUser } from '@/lib/auth'

import { DashboardView } from './dashboard-view'

export default async function DashboardPage() {
  // Server-side guard (middleware is the primary gate; this is defense in depth).
  const user = await getSessionUser()
  if (!user) redirect('/auth/login')

  return (
    <ProtectedRoute>
      <DashboardView user={user} />
    </ProtectedRoute>
  )
}
