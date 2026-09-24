import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectHealthChart } from '@/components/dashboard/project-health-chart'
import { getHealthLevel, HEALTH_LABEL, mockProjects, type HealthLevel } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const LEVEL_BADGE: Record<HealthLevel, string> = {
  good: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  critical: 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400',
}

const LEVEL_TEXT: Record<HealthLevel, string> = {
  good: 'text-emerald-600 dark:text-emerald-400',
  medium: 'text-amber-600 dark:text-amber-400',
  critical: 'text-red-600 dark:text-red-400',
}

/** Top 5 active projects with the lowest health score, chart + legend + list. */
export function ProjectHealth() {
  const lowest = mockProjects
    .filter((p) => p.status !== 'DELETED')
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 5)

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Project Health</CardTitle>
          <CardDescription>5 projects needing the most attention</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href="/projects">
            All projects
            <ArrowUpRight />
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-5">
        <ProjectHealthChart
          data={lowest.map((p) => ({ name: p.name, healthScore: p.healthScore }))}
        />

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {(['good', 'medium', 'critical'] as HealthLevel[]).map((level) => (
            <span key={level} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{
                  backgroundColor:
                    level === 'good' ? '#10b981' : level === 'medium' ? '#f59e0b' : '#ef4444',
                }}
              />
              {HEALTH_LABEL[level]}
            </span>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2">
          {lowest.map((project) => {
            const level = getHealthLevel(project.healthScore)
            return (
              <div
                key={project.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {project.description ?? '—'} · {project.environment}
                  </p>
                </div>
                <span className={cn('text-sm font-semibold tabular-nums', LEVEL_TEXT[level])}>
                  {project.healthScore}
                </span>
                <Badge variant="outline" className={cn('font-medium', LEVEL_BADGE[level])}>
                  {HEALTH_LABEL[level]}
                </Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
