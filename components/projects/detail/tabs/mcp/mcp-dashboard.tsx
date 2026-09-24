import type { MCPConnection } from '@prisma/client'
import { Plug, Unplug, PlugZap, TriangleAlert } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { countAllowedTools } from '@/lib/api/mcp'
import { cn } from '@/lib/utils'

/** At-a-glance summary of every MCP connection. */
export function McpDashboard({ connections }: { connections: MCPConnection[] }) {
  const connected = connections.filter((c) => c.status === 'CONNECTED').length
  const disconnected = connections.filter((c) => c.status === 'DISCONNECTED').length
  const errors = connections.filter((c) => c.status === 'ERROR').length
  const totalTools = connections.reduce((acc, c) => acc + countAllowedTools(c), 0)

  const cards = [
    {
      label: 'Connected',
      value: connected,
      icon: PlugZap,
      iconClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      hint: connected === 1 ? 'active connection' : 'active connections',
    },
    {
      label: 'Disconnected',
      value: disconnected,
      icon: Unplug,
      iconClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
      hint: 'not connected',
    },
    {
      label: 'Errors',
      value: errors,
      icon: TriangleAlert,
      iconClass: 'bg-red-500/10 text-red-600 dark:text-red-400',
      hint: errors > 0 ? 'need attention' : 'all good',
    },
    {
      label: 'Allowed tools',
      value: totalTools,
      icon: Plug,
      iconClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      hint: `across ${connections.length} connections`,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-lg',
                  card.iconClass,
                )}
              >
                <Icon className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xl font-bold tabular-nums">{card.value}</p>
                <p className="text-xs text-muted-foreground">
                  {card.label} · {card.hint}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
