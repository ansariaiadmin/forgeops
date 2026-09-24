'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'

import type { AgentUsagePoint } from '@/lib/api/agents'

function UsageTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as AgentUsagePoint | undefined
  if (!point) return null

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">
        Tokens: <span className="font-medium text-foreground">{point.tokens.toLocaleString()}</span>
      </p>
      <p className="text-xs text-muted-foreground">
        Cost: <span className="font-medium text-foreground">${point.cost.toFixed(4)}</span>
      </p>
    </div>
  )
}

/** 14-day token consumption area chart. */
export function UsageChart({ data }: { data: AgentUsagePoint[] }) {
  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
          <defs>
            <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={UsageTooltip} />
          <Area
            type="monotone"
            dataKey="tokens"
            stroke="hsl(var(--primary))"
            strokeWidth={1.5}
            fill="url(#tokenGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
