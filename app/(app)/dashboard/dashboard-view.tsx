import { Badge } from '@/components/ui/badge'
import { AgentStatus } from '@/components/dashboard/agent-status'
import { ProjectHealth } from '@/components/dashboard/project-health'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { StatCards } from '@/components/dashboard/stat-cards'
import { TreasuryCards } from '@/components/dashboard/treasury-cards'
import type { SessionUser } from '@/lib/auth'
import { formatDate } from '@/utils/format'

interface DashboardViewProps {
  user: SessionUser
}

export function DashboardView({ user }: DashboardViewProps) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(new Date())} · Welcome back, {user.name ?? 'developer'}
          </p>
        </div>
        <Badge variant="secondary" className="font-mono">
          {user.role}
        </Badge>
      </div>

      {/* Statistics */}
      <StatCards />

      {/* Treasury (AURORA 1010/1020/1030) */}
      <TreasuryCards />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <QuickActions />
        </div>
        <div className="lg:col-span-8">
          <RecentActivity />
        </div>
        <div className="lg:col-span-8">
          <ProjectHealth />
        </div>
        <div className="lg:col-span-4">
          <AgentStatus />
        </div>
      </div>
    </div>
  )
}
