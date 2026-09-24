import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface TabPlaceholderProps {
  icon: LucideIcon
  title: string
  description: string
  features: string[]
}

/**
 * Empty-state placeholder for project tabs that are implemented
 * in the next milestone. Each tab keeps its own component file.
 */
export function TabPlaceholder({ icon: Icon, title, description, features }: TabPlaceholderProps) {
  return (
    <Card className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="flex size-14 items-center justify-center rounded-full border bg-muted/50">
        <Icon className="size-6 text-muted-foreground" />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold tracking-tight">{title}</p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {features.map((feature) => (
          <span
            key={feature}
            className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground"
          >
            {feature}
          </span>
        ))}
      </div>

      <Button variant="outline" size="sm" disabled>
        Coming soon
      </Button>
    </Card>
  )
}
