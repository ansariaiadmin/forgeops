'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MetricSeries } from '@/lib/api/health'

function MetricTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as { v: number; unit?: string } | undefined
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-semibold tabular-nums">
        {point ? point.v.toLocaleString() : ''}
        {point?.unit ? ` ${point.unit}` : ''}
      </span>
    </div>
  )
}

/** Four live metric line charts: CPU, RAM, Network I/O and Request Rate. */
export function MetricsCharts({ series }: { series: MetricSeries[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {series.map((metric) => (
        <Card key={metric.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
            <span
              className="font-mono text-xs tabular-nums text-muted-foreground"
              style={{ color: metric.color }}
            >
              {metric.unit}
            </span>
          </CardHeader>
          <CardContent>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metric.points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="t"
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    interval={5}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={MetricTooltip} />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={metric.color}
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
