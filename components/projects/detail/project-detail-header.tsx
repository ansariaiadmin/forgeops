import Link from 'next/link'
import { ArrowLeft, Bot, Container, User } from 'lucide-react'

import {
  HealthScoreBadge,
  ProjectEnvironmentBadge,
  ProjectStatusBadge,
} from '@/components/projects/badges'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { ProjectDetail } from '@/lib/api/projects'
import { formatDate, timeAgo } from '@/utils/format'

function MetaChip({ icon: Icon, label }: { icon: typeof Container; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

/** Project detail header: name, badges, health score and quick meta. */
export function ProjectDetailHeader({ detail }: { detail: ProjectDetail }) {
  const { project, services, agents, ownerName } = detail

  return (
    <header className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild className="mt-0.5 shrink-0">
          <Link href="/projects" aria-label="Back to projects">
            <ArrowLeft />
          </Link>
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <ProjectStatusBadge status={project.status} />
            <ProjectEnvironmentBadge environment={project.environment} />
          </div>
          <p className="mt-1 font-mono text-xs text-muted-foreground">/{project.slug}</p>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{project.description}</p>
          )}
        </div>

        <HealthScoreBadge score={project.healthScore} />
      </div>

      <Separator />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <MetaChip icon={User} label={ownerName} />
        <MetaChip icon={Container} label={`${services.length} services`} />
        <MetaChip icon={Bot} label={`${agents.length} agents`} />
        <span className="text-xs text-muted-foreground">
          Created {formatDate(project.createdAt)}
        </span>
        <span className="text-xs text-muted-foreground">Updated {timeAgo(project.updatedAt)}</span>
      </div>
    </header>
  )
}
