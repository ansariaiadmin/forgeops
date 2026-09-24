import Link from 'next/link'
import type { Project } from '@prisma/client'
import { ArrowUpRight, Bot, Container, Eye, Pencil, Trash2 } from 'lucide-react'

import { ENV_BADGE, HEALTH_FILL, HEALTH_TEXT, STATUS_BADGE } from '@/components/projects/badges'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getHealthLevel, HEALTH_LABEL, techMeta } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { timeAgo } from '@/utils/format'

interface ProjectCardProps {
  project: Project
  servicesCount: number
  agentsCount: number
  onEdit: () => void
  onDelete: () => void
}

/** Single project card in the projects grid. */
export function ProjectCard({
  project,
  servicesCount,
  agentsCount,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const level = getHealthLevel(project.healthScore)
  const stack = Array.isArray(project.techStack) ? (project.techStack as string[]) : []

  return (
    <Card className="flex flex-col">
      <CardHeader className="gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/projects/${project.slug}`}
            className="group flex min-w-0 items-center gap-1.5"
          >
            <span className="truncate font-semibold tracking-tight transition-colors group-hover:text-primary">
              {project.name}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
          <Badge
            variant="outline"
            className={cn('shrink-0 font-mono text-[10px]', STATUS_BADGE[project.status])}
          >
            {project.status}
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={cn('font-mono text-[10px]', ENV_BADGE[project.environment])}
          >
            {project.environment}
          </Badge>
          <span className="truncate font-mono text-[10px] text-muted-foreground">
            /{project.slug}
          </span>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {project.description ?? 'No description yet.'}
        </p>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        {/* Tech stack */}
        {stack.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {stack.slice(0, 5).map((tech) => {
              const meta = techMeta(tech)
              return (
                <span
                  key={tech}
                  title={tech}
                  className={cn(
                    'flex size-6 items-center justify-center rounded-md text-[10px] font-semibold',
                    meta.className,
                  )}
                >
                  {meta.short}
                </span>
              )
            })}
            {stack.length > 5 && (
              <span className="text-xs text-muted-foreground">+{stack.length - 5}</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No tech stack defined.</p>
        )}

        {/* Health */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Health</span>
            <span className="flex items-center gap-1.5">
              <span className={cn('font-semibold tabular-nums', HEALTH_TEXT[level])}>
                {project.healthScore}
                <span className="font-normal text-muted-foreground">/100</span>
              </span>
              <span className={cn('text-[10px] font-medium', HEALTH_TEXT[level])}>
                {HEALTH_LABEL[level]}
              </span>
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', HEALTH_FILL[level])}
              style={{ width: `${project.healthScore}%` }}
            />
          </div>
        </div>

        <Separator />

        {/* Meta */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Container className="size-3.5" />
            {servicesCount} services
          </span>
          <span className="flex items-center gap-1.5">
            <Bot className="size-3.5" />
            {agentsCount} agents
          </span>
          <span className="truncate">Updated {timeAgo(project.updatedAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="justify-end gap-1 border-t pt-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/projects/${project.slug}`}>
            <Eye />
            View
          </Link>
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
