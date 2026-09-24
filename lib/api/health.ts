import { mockServices } from '@/lib/mock-data'

/**
 * Mock API layer for the Health & Logs tab.
 *
 * Future REST surface (UI stays unchanged):
 *   GET /api/projects/[slug]/health
 *   GET /api/projects/[slug]/health/services
 *   GET /api/projects/[slug]/logs?level=&service=&since=
 *   GET /api/projects/[slug]/logs/stream        (SSE/WebSocket in prod)
 *   GET /api/projects/[slug]/metrics?range=30m
 *   GET /api/projects/[slug]/alerts
 *   POST /api/projects/[slug]/alerts/[id]/test
 */

// ─────────────────────────────── Types ───────────────────────────────

export type FactorStatus = 'good' | 'medium' | 'critical'

export interface HealthFactor {
  key: string
  label: string
  value: number // 0–100 (higher = healthier)
  display: string
  status: FactorStatus
}

export interface HealthSummary {
  score: number
  status: FactorStatus
  factors: HealthFactor[]
}

export interface ServiceHealth {
  id: string
  name: string
  image: string
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN'
  healthStatus: string
  cpuPercent: number
  memoryMb: number
  uptimeSec: number
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR'

export interface LogEntry {
  id: string
  at: Date
  level: LogLevel
  service: string
  message: string
}

export interface AlertConfig {
  id: string
  label: string
  description: string
  severity: 'warning' | 'critical'
  enabled: boolean
}

export interface MetricSeries {
  label: string
  unit: string
  color: string
  points: Array<{ t: string; v: number }>
}

// ─────────────────────────────── Factor helpers ───────────────────────────────

export function factorStatus(value: number): FactorStatus {
  if (value >= 70) return 'good'
  if (value >= 40) return 'medium'
  return 'critical'
}

/** Map "recent errors" count to a 0–100 health value. */
export function errorsToHealth(count: number): number {
  if (count === 0) return 100
  if (count <= 2) return 80
  if (count <= 5) return 55
  return Math.max(10, 40 - count * 4)
}

// ─────────────────────────────── Mock: health summary ───────────────────────────────

export async function getHealthSummary(projectId: string): Promise<HealthSummary> {
  const services = mockServices.filter((service) => service.projectId === projectId)

  const containerHealth = services.length
    ? Math.round(
        (services.filter((service) => service.healthStatus === 'healthy').length /
          services.length) *
          100,
      )
    : 0

  const factors: HealthFactor[] = [
    {
      key: 'containers',
      label: 'Container Health',
      value: containerHealth,
      display: `${containerHealth}% healthy`,
      status: factorStatus(containerHealth),
    },
    {
      key: 'errors',
      label: 'Recent Errors',
      value: errorsToHealth(2),
      display: '2 in last 24h',
      status: factorStatus(errorsToHealth(2)),
    },
    {
      key: 'coverage',
      label: 'Test Coverage',
      value: 84,
      display: '84%',
      status: factorStatus(84),
    },
    {
      key: 'docs',
      label: 'Docs Freshness',
      value: 76,
      display: '76% updated < 30d',
      status: factorStatus(76),
    },
    {
      key: 'rag',
      label: 'RAG Index Status',
      value: 80,
      display: '3/3 sources indexed',
      status: factorStatus(80),
    },
    {
      key: 'backup',
      label: 'Backup Status',
      value: 100,
      display: 'Last backup ok · 2h ago',
      status: factorStatus(100),
    },
  ]

  const weights: Record<string, number> = {
    containers: 0.3,
    errors: 0.15,
    coverage: 0.2,
    docs: 0.1,
    rag: 0.1,
    backup: 0.15,
  }
  const score = Math.round(
    factors.reduce((sum, factor) => sum + factor.value * (weights[factor.key] ?? 0), 0),
  )

  return { score, status: factorStatus(score), factors }
}

// ─────────────────────────────── Mock: service health ───────────────────────────────

const UPTIME: Record<string, number> = {
  'svc-web': 12 * 3600,
  'svc-db': 72 * 3600,
  'svc-worker-core': 8 * 3600,
  'svc-backup-core': 0,
}

export async function getServiceHealth(projectId: string): Promise<ServiceHealth[]> {
  return mockServices
    .filter((service) => service.projectId === projectId)
    .map((service) => {
      const hash = service.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      const running = service.status === 'RUNNING'
      return {
        id: service.id,
        name: service.name,
        image: service.image,
        status: service.status,
        healthStatus: service.healthStatus,
        cpuPercent: running ? Number((0.4 + (hash % 20) / 10).toFixed(1)) : 0,
        memoryMb: running ? (hash % 320) + 80 : 0,
        uptimeSec: running ? (UPTIME[service.id] ?? 6 * 3600) : 0,
      }
    })
}

// ─────────────────────────────── Mock: logs ───────────────────────────────

const LOG_MESSAGES: Record<LogLevel, string[]> = {
  INFO: [
    'healthcheck passed (200 OK in 12ms)',
    'handled request GET /api/v1/status 200',
    'connection pool: 5/10 connections in use',
    'handled request POST /api/v1/deploy 202',
    'worker picked up job job-2842',
    'cache refreshed — 214 keys',
    'listening on 0.0.0.0:8080',
    'job completed in 94s',
  ],
  WARN: [
    'slow query detected (480ms) — consider index on tasks.status',
    'retrying healthcheck (attempt 2/5)',
    'connection pool at 90% capacity',
    'disk usage above 70% threshold on /data',
    'response time p95 above target (210ms)',
  ],
  ERROR: [
    'healthcheck failed: GET /health -> 503',
    'uncaught exception: EADDRINUSE: address already in use :8080',
    'migration timeout after 120s (lock on tasks table)',
    'failed to fetch image manifest: connection reset',
    'worker crashed — restarting (attempt 3/5)',
  ],
}

const SERVICE_NAMES = ['web', 'api', 'worker', 'db', 'backup-runner']

const secondsAgo = (s: number) => new Date(Date.now() - s * 1000)

function randomLine(index: number): LogEntry {
  const roll = Math.random()
  const level: LogLevel = roll > 0.92 ? 'ERROR' : roll > 0.75 ? 'WARN' : 'INFO'
  const messages = LOG_MESSAGES[level]
  const message = messages[Math.floor(Math.random() * messages.length)]
  return {
    id: `log-${index}`,
    at: secondsAgo(Math.floor(Math.random() * 3600)),
    level,
    service: SERVICE_NAMES[Math.floor(Math.random() * SERVICE_NAMES.length)],
    message,
  }
}

/** Initial log buffer (newest last). */
export function getInitialLogs(count = 80): LogEntry[] {
  return Array.from({ length: count }, (_, index) => randomLine(1000 - index)).sort(
    (a, b) => a.at.getTime() - b.at.getTime(),
  )
}

let streamCounter = 0

/** One live log line (newest). */
export function generateLiveLog(): LogEntry {
  streamCounter += 1
  const line = randomLine(streamCounter)
  return { ...line, id: `live-${streamCounter}`, at: new Date() }
}

// ─────────────────────────────── Mock: alerts ───────────────────────────────

export const ALERT_CONFIGS: AlertConfig[] = [
  {
    id: 'crash-loop',
    label: 'Crash Loop',
    description: 'Alert when a container restarts 3+ times within 10 minutes.',
    severity: 'critical',
    enabled: true,
  },
  {
    id: 'disk-full',
    label: 'Disk Full',
    description: 'Alert when any volume exceeds 85% disk usage.',
    severity: 'critical',
    enabled: false,
  },
  {
    id: 'high-ram',
    label: 'High RAM Usage',
    description: 'Alert when a service exceeds 800 MB RSS for 5 consecutive minutes.',
    severity: 'warning',
    enabled: true,
  },
  {
    id: 'mcp-disconnect',
    label: 'MCP Disconnection',
    description: 'Alert when an MCP connection drops or times out.',
    severity: 'warning',
    enabled: true,
  },
]

export interface AlertTestResult {
  id: string
  ok: boolean
  message: string
}

/** Simulated alert test; later: POST /api/projects/[slug]/alerts/[id]/test. */
export async function testAlert(config: AlertConfig): Promise<AlertTestResult> {
  await new Promise((resolve) => setTimeout(resolve, 900))
  return {
    id: config.id,
    ok: true,
    message: `${config.label} alert fired — notification delivered to #deploys.`,
  }
}

// ─────────────────────────────── Mock: metrics ───────────────────────────────

let metricCursor = 0

/** One live metric point (emitted by the SSE stream every 3s). */
export function generateMetricPoint(): {
  t: string
  cpu: number
  ram: number
  network: number
  requests: number
} {
  metricCursor += 1
  const i = metricCursor
  const wave = (base: number, amp: number, phase: number) =>
    Math.max(1, base + amp * Math.sin(i / 4 + phase) + (Math.random() - 0.5) * amp * 0.5)

  return {
    t: new Date().toISOString().slice(11, 19),
    cpu: Math.round(wave(34, 16, 0) * 10) / 10,
    ram: Math.round(wave(520, 150, 2)),
    network: Math.round(wave(12, 6, 4) * 10) / 10,
    requests: Math.round(wave(220, 90, 6)),
  }
}

export function getMetricSeries(_projectId: string): MetricSeries[] {
  const points = 30
  const now = Date.now()
  const t = (i: number) => new Date(now - (points - i) * 60_000).toISOString().slice(11, 19)

  const wave = (i: number, base: number, amp: number, phase: number) =>
    base + amp * Math.sin(i / 4 + phase) + (Math.random() - 0.5) * amp * 0.6

  return [
    {
      label: 'CPU Usage',
      unit: '%',
      color: '#38bdf8',
      points: Array.from({ length: points }, (_, i) => ({
        t: t(i),
        v: Math.max(2, Math.round(wave(i, 34, 18, 0) * 10) / 10),
      })),
    },
    {
      label: 'RAM Usage',
      unit: 'MB',
      color: '#a78bfa',
      points: Array.from({ length: points }, (_, i) => ({
        t: t(i),
        v: Math.round(wave(i, 520, 160, 2)),
      })),
    },
    {
      label: 'Network I/O',
      unit: 'MB/s',
      color: '#34d399',
      points: Array.from({ length: points }, (_, i) => ({
        t: t(i),
        v: Math.max(0.1, Math.round(wave(i, 12, 7, 4) * 10) / 10),
      })),
    },
    {
      label: 'Request Rate',
      unit: 'req/s',
      color: '#fbbf24',
      points: Array.from({ length: points }, (_, i) => ({
        t: t(i),
        v: Math.max(5, Math.round(wave(i, 220, 110, 6))),
      })),
    },
  ]
}
