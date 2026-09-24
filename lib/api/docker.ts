import type { DockerService } from '@prisma/client'
import { Prisma } from '@prisma/client'

import { prisma } from '@/lib/prisma'

export interface ServiceEnvVar {
  key: string
  value: string
  isSecret: boolean
}

export interface ServiceRuntime {
  cpuPercent: number
  memoryMb: number
  logs: string[]
}

export interface DockerServiceDetail {
  service: DockerService
  env: ServiceEnvVar[]
  runtime: ServiceRuntime | null
}

export interface ComposeConfig {
  filename: string
  content: string
  services: string[]
}

export interface CreateServiceInput {
  projectId: string
  name: string
  image: string
  ports?: Record<string, string>
  volumes?: string[]
  networks?: string[]
}

// ─────────────────────────────── Client fetch wrappers (real API) ───────────────────────────────

/**
 * Fetch the Docker services of a project from the real API.
 * (GET /api/projects/[slug]/services)
 */
export async function getDockerServices(slug: string): Promise<DockerService[]> {
  try {
    const response = await fetch(`/api/projects/${slug}/services`, { cache: 'no-store' })
    if (!response.ok) return []
    const data = (await response.json()) as { services?: DockerService[] }
    return data.services ?? []
  } catch {
    return []
  }
}

/**
 * Run a service action through the real API.
 * (POST /api/projects/[slug]/services/[id]  { action })
 */
export async function runServiceAction(
  slug: string,
  serviceId: string,
  action: 'start' | 'stop' | 'restart' | 'delete',
): Promise<boolean> {
  try {
    const response = await fetch(`/api/projects/${slug}/services/${serviceId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    return response.ok
  } catch {
    return false
  }
}

/** Create a service through the real API. (POST /api/projects/[slug]/services) */
export async function createService(
  slug: string,
  input: { name: string; image: string; ports?: string; volumes?: string; networks?: string },
): Promise<DockerService | null> {
  try {
    const response = await fetch(`/api/projects/${slug}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    if (!response.ok) return null
    const data = (await response.json()) as { service?: DockerService }
    return data.service ?? null
  } catch {
    return null
  }
}

// ─────────────────────────────── Real Prisma API (server-side) ───────────────────────────────

/** List services by projectId — real Prisma */
export async function getServicesByProjectId(projectId: string): Promise<DockerService[]> {
  return prisma.dockerService.findMany({
    where: { projectId },
    orderBy: { name: 'asc' },
  })
}

/** Get single service by ID */
export async function getServiceById(id: string): Promise<DockerService | null> {
  return prisma.dockerService.findUnique({ where: { id } })
}

/** Create service — real Prisma with validation */
export async function createServicePrisma(input: CreateServiceInput): Promise<DockerService> {
  if (!input.name || !/^[a-z0-9]+(?:[-_][a-z0-9]+)*$/.test(input.name)) {
    throw new Error('Invalid service name — use lowercase letters, numbers, hyphens')
  }
  if (!input.image || !input.image.includes(':')) {
    throw new Error('Image must be in image:tag format')
  }

  const existing = await prisma.dockerService.findFirst({
    where: { projectId: input.projectId, name: input.name },
  })
  if (existing) throw new Error(`Service "${input.name}" already exists`)

  return prisma.dockerService.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      image: input.image,
      ports: (input.ports ?? {}) as Prisma.InputJsonValue,
      volumes: (input.volumes ?? []) as Prisma.InputJsonValue,
      networks: (input.networks ?? []) as Prisma.InputJsonValue,
      status: 'STOPPED',
      healthStatus: 'stopped',
      containerId: null,
    },
  })
}

/** Update service status */
export async function updateServiceStatus(
  id: string,
  status: 'RUNNING' | 'STOPPED' | 'ERROR' | 'UNKNOWN',
): Promise<DockerService> {
  const existing = await prisma.dockerService.findUnique({ where: { id } })
  if (!existing) throw new Error('Service not found')

  return prisma.dockerService.update({
    where: { id },
    data: {
      status,
      healthStatus: status === 'STOPPED' ? 'stopped' : status === 'RUNNING' ? 'healthy' : 'unknown',
      updatedAt: new Date(),
    },
  })
}

/** Delete service */
export async function deleteService(id: string): Promise<void> {
  const existing = await prisma.dockerService.findUnique({ where: { id } })
  if (!existing) throw new Error('Service not found')
  await prisma.dockerService.delete({ where: { id } })
}

// ─────────────────────────────── Env & Runtime (real + fallback) ───────────────────────────────

/** Env vars for a service — real Prisma */
export async function getServiceEnvReal(serviceId: string): Promise<ServiceEnvVar[]> {
  const envVars = await prisma.environmentVariable.findMany({
    where: { projectId: (await prisma.dockerService.findUnique({ where: { id: serviceId } }))?.projectId },
  })

  return envVars.map((ev) => ({
    key: ev.key,
    value: ev.isSecret ? '••••••••' : ev.value,
    isSecret: ev.isSecret,
  }))
}

/** Legacy mock env — kept for UI that doesn't use real env yet */
export function getServiceEnv(service: DockerService): ServiceEnvVar[] {
  const shared: ServiceEnvVar[] = [
    { key: 'NODE_ENV', value: 'production', isSecret: false },
    { key: 'LOG_LEVEL', value: 'info', isSecret: false },
  ]
  const secret: ServiceEnvVar[] = [{ key: 'SERVICE_TOKEN', value: 'tok_live_4f8a…', isSecret: true }]

  switch (service.name) {
    case 'db':
      return [
        { key: 'POSTGRES_DB', value: 'forgeops', isSecret: false },
        { key: 'POSTGRES_USER', value: 'forgeops', isSecret: false },
        { key: 'POSTGRES_PASSWORD', value: '••••••••', isSecret: true },
        { key: 'PGDATA', value: '/var/lib/postgresql/data', isSecret: false },
      ]
    case 'web':
      return [
        { key: 'PORT', value: '3000', isSecret: false },
        { key: 'DATABASE_URL', value: 'postgres://forgeops@db:5432/forgeops', isSecret: true },
        { key: 'JWT_SECRET', value: '••••••••', isSecret: true },
        ...shared,
      ]
    case 'api':
    case 'worker':
      return [
        { key: 'PORT', value: '8080', isSecret: false },
        { key: 'REDIS_URL', value: 'redis://redis:6379', isSecret: false },
        { key: 'DATABASE_URL', value: 'postgres://forgeops@db:5432/forgeops', isSecret: true },
        ...shared,
      ]
    default:
      return [...shared, ...secret]
  }
}

/** Deterministic base load for a service; the UI walks it on each poll. */
function baseRuntime(service: DockerService): { cpu: number; memoryMb: number } {
  const hash = service.id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const cpu = (hash % 22) / 10 + (service.status === 'RUNNING' ? 0.6 : 0.1)
  const memoryMb = (hash % 340) + (service.status === 'RUNNING' ? 96 : 24)
  return { cpu, memoryMb }
}

/** Build runtime info (CPU, RAM, logs) for a service. */
export async function getServiceRuntime(service: DockerService): Promise<ServiceRuntime> {
  const { cpu, memoryMb } = baseRuntime(service)
  return { cpuPercent: cpu, memoryMb, logs: buildLogs(service, 24) }
}

/** Generate the last N log lines for a service */
export function buildLogs(service: DockerService, count: number): string[] {
  const lines: string[] = []
  const now = Date.now()

  const push = (level: 'INFO' | 'WARN' | 'ERROR', message: string, secondsAgo: number) => {
    lines.push(
      `${new Date(now - secondsAgo * 1000).toISOString()} ${level} ${service.name}: ${message}`,
    )
  }

  if (service.status === 'ERROR') {
    push('ERROR', 'container exited with code 1', 8)
    push('ERROR', 'healthcheck failed: GET /health -> 503', 12)
    push('WARN', 'retrying healthcheck (attempt 3/5)', 14)
    push('ERROR', 'uncaught exception: EADDRINUSE: address already in use :8080', 18)
    push('INFO', 'startup sequence beginning', 22)
  } else if (service.status === 'STOPPED') {
    push('INFO', 'received SIGTERM, shutting down gracefully', 20)
    push('INFO', 'stopped accepting new connections', 21)
    push('INFO', 'container stopped', 24)
  } else {
    push('INFO', 'healthcheck passed (200 OK in 12ms)', 6)
    push('INFO', 'handled request GET /api/v1/status 200', 9)
    push('INFO', 'connection pool: 5/10 connections in use', 13)
    push('INFO', 'handled request POST /api/v1/deploy 202', 17)
    push('INFO', 'listening on 0.0.0.0:8080', 22)
  }

  while (lines.length < count) {
    lines.unshift(
      `${new Date(now - lines.length * 45_000).toISOString()} INFO ${service.name}: worker idle`,
    )
  }

  return lines.slice(-count)
}

/** Format the ports JSON as "host:container" strings. */
export function formatPorts(ports: DockerService['ports']): string[] {
  if (!ports || typeof ports !== 'object' || Array.isArray(ports)) return []
  return Object.entries(ports as Record<string, string>).map(([host, container]) =>
    host === container ? host : `${host}:${container}`,
  )
}

/** Parse user input like "3000:80, 5432" into a ports record. */
export function parsePortsInput(input: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const part of input.split(',')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const [host, container = host] = trimmed.split(':')
    if (host) result[host.trim()] = container.trim() || host.trim()
  }
  return result
}

/** Parse a compose file's service names */
export function parseComposeServices(content: string): string[] {
  const names: string[] = []
  let inServices = false
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (/^services:$/.test(trimmed)) {
      inServices = true
      continue
    }
    if (inServices && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      if (/^[a-zA-Z0-9_-]+:$/.test(trimmed)) {
        names.push(trimmed.slice(0, -1))
      } else if (!line.startsWith(' ') && !line.startsWith('\t')) {
        inServices = false
      }
    }
  }
  return names
}

/** Default compose file derived from a project's services. */
export function buildComposeConfig(services: DockerService[]): ComposeConfig {
  const content = [
    'services:',
    ...services.map((service) => {
      const ports = formatPorts(service.ports)
      const volumes = Array.isArray(service.volumes) ? (service.volumes as string[]) : []
      const lines = [
        `  ${service.name}:`,
        `    image: ${service.image}`,
        ...(ports.length ? [`    ports:`, ...ports.map((p) => `      - "${p}"`)] : []),
        ...(volumes.length ? [`    volumes:`, ...volumes.map((v) => `      - ${v}`)] : []),
      ]
      return lines.join('\n')
    }),
    '',
  ].join('\n')

  return {
    filename: 'docker-compose.yml',
    content,
    services: services.map((service) => service.name),
  }
}

/** Fetch the compose config for a project */
export async function getComposeConfig(services: DockerService[]): Promise<ComposeConfig | null> {
  if (services.length === 0) return null
  return buildComposeConfig(services)
}
