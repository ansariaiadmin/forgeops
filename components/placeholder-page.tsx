import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
}

/**
 * Generic "under construction" page for nav destinations
 * that don't have a real implementation yet.
 */
export function PlaceholderPage({ title, description, icon: Icon }: PlaceholderPageProps) {
  return (
    <div className="flex min-h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <Card className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border bg-muted/50">
          <Icon className="size-6 text-muted-foreground" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="font-medium">Coming soon</p>
          <p className="text-sm text-muted-foreground">This module is under construction.</p>
        </div>
        <Button variant="outline" size="sm" disabled>
          Not available yet
        </Button>
      </Card>
    </div>
  )
}
