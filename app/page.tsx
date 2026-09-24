import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/utils/format'

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(new Date())} · Workspace overview
          </p>
        </div>
        <Button disabled>
          <Loader2 className="animate-spin" />
          Syncing
        </Button>
      </div>

      {/* Empty state */}
      <Card className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
        <div className="flex size-14 items-center justify-center rounded-full border bg-muted/50">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-sm font-semibold tracking-tight sm:text-base">
            ForgeOps - Loading...
          </p>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Initializing workspace, fetching latest state...
          </p>
        </div>

        <div className="flex w-full max-w-sm flex-col items-center gap-2">
          <Skeleton className="h-2.5 w-full" />
          <Skeleton className="h-2.5 w-4/5" />
          <Skeleton className="h-2.5 w-3/5" />
        </div>
      </Card>
    </div>
  )
}
