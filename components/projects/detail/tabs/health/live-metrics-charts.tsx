'use client'

import * as React from 'react'
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
import { useEventStream } from '@/hooks/use-event-stream'

const WINDOW = 30

interface MetricPoint {
  t: string
  cpu: number
  ram: number
  network: number
  requests: number
}

const METRICS: Array<{
  key: keyof Omit<MetricPoint, 't'>
  label: string
  unit: string
  color: string
}> = [
  { key: 'cpu', label: 'CPU Usage', unit: '%', color: '#38bdf8' },
  { key: 'ram', label: 'RAM Usage', unit: 'MB', color: '#a78bfa' },
  { key: 'network', label: 'Network I/O', unit: 'MB/s', color: '#34d399' },
  { key: 'requests', label: 'Request Rate', unit: 'req/s', color: '#fbbf24' },
]

function MetricTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as MetricPoint | undefined
  const metric = payload[0]?.name
  const meta = METRICS.find((m) => m.key === metric)
  return (
    <div className="rounded-md border bg-popover px-3 py-1.5 text-xs text-popover-foreground shadow-md">
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-2 font-semibold tabular-nums">
        {point && metric ? point[metric as keyof Omit<MetricPoint, 't'>] : ''}
        {meta ? ` ${meta.unit}` : ''}
      </span>
    </div>
  )
}

/** Four live metric charts fed by the SSE stream (30-point rolling window). */
export function LiveMetricsCharts({ slug }: { slug: string }) {
  const [points, setPoints] = React.useState<MetricPoint[]>([])

  const { connected } = useEventStream(`/api/projects/${slug}/live/metrics`, (data) => {
    try {
      const point = JSON.parse(data) as MetricPoint
      if (typeof point.cpu === 'number') {
        setPoints((prev) => [...prev.slice(-(WINDOW - 1)), point])
      }
    } catch {
      /* ignore malformed frames */
    }
  })

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="relative flex size-2">
          <span
            className={
              connected
                ? 'absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60'
                : 'absolute inline-flex size-full rounded-full bg-amber-400 opacity-60'
            }
          />
          <span
            className={
              connected
                ? 'relative inline-flex size-2 rounded-full bg-emerald-500'
                : 'relative inline-flex size-2 rounded-full bg-amber-500'
            }
          />
        </span>
        {connected ? 'Live — 3s updates' : 'Connecting…'}
      </p>

      {points.length === 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {METRICS.map((metric) => (
            <Card key={metric.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-36 animate-pulse rounded-md bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {METRICS.map((metric) => (
            <Card key={metric.key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                <span className="font-mono text-xs tabular-nums" style={{ color: metric.color }}>
                  {points[points.length - 1][metric.key]}
                  <span className="ml-1 text-muted-foreground">{metric.unit}</span>
                </span>
              </CardHeader>
              <CardContent>
                <div className="h-36 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
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
                        interval={6}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={MetricTooltip} />
                      <Line
                        type="monotone"
                        dataKey={metric.key}
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
      )}
    </div>
  )
}
