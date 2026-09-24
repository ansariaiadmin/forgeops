'use client'

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'

import { getHealthLevel, HEALTH_LABEL, type HealthLevel } from '@/lib/mock-data'

const LEVEL_COLOR: Record<HealthLevel, string> = {
  good: '#10b981',
  medium: '#f59e0b',
  critical: '#ef4444',
}

export interface HealthChartDatum {
  name: string
  healthScore: number
}

function HealthTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const item = payload[0]?.payload as HealthChartDatum | undefined
  if (!item) return null

  const level = getHealthLevel(item.healthScore)

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="font-mono text-xs font-medium">{item.name}</p>
      <p className="text-xs text-muted-foreground">
        Health: <span className="font-medium text-foreground">{item.healthScore}</span> ·{' '}
        <span style={{ color: LEVEL_COLOR[level] }}>{HEALTH_LABEL[level]}</span>
      </p>
    </div>
  )
}

/**
 * Horizontal bar chart of the 5 lowest-health projects,
 * each bar colored by its health level.
 */
export function ProjectHealthChart({ data }: { data: HealthChartDatum[] }) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
          barCategoryGap={10}
        >
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip cursor={{ fill: 'hsl(var(--muted) / 0.4)' }} content={HealthTooltip} />
          <Bar dataKey="healthScore" radius={[0, 4, 4, 0]} barSize={16}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={LEVEL_COLOR[getHealthLevel(entry.healthScore)]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
