import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getHealthSummary,
  getServiceHealth,
  getLogs,
  checkDockerConnection,
  getDockerContainers,
  getServiceLogs,
  factorStatus,
  errorsToHealth,
} from '@/lib/api/health'

let testProjectId: string

describe('Health API — real Prisma + Docker integration', () => {
  beforeAll(async () => {
    const project = await prisma.project.findFirst()
    if (!project) throw new Error('Seed required')
    testProjectId = project.id
  })

  it('query Docker containers + agent status — via Prisma', async () => {
    const services = await getServiceHealth(testProjectId)
    expect(Array.isArray(services)).toBe(true)
    // Seed has 10 services across 10 projects, but at least 1 for first project?
    // We check that function returns array and each entry has required fields
    if (services.length > 0) {
      const svc = services[0]
      expect(svc).toHaveProperty('id')
      expect(svc).toHaveProperty('name')
      expect(svc).toHaveProperty('status')
      expect(svc).toHaveProperty('cpuPercent')
    }

    const summary = await getHealthSummary(testProjectId)
    expect(summary).toHaveProperty('score')
    expect(summary).toHaveProperty('status')
    expect(summary).toHaveProperty('factors')
    expect(summary.factors.length).toBeGreaterThan(0)
    expect(typeof summary.score).toBe('number')
    expect(summary.score).toBeGreaterThanOrEqual(0)
    expect(summary.score).toBeLessThanOrEqual(100)

    // Helpers
    expect(factorStatus(80)).toBe('good')
    expect(factorStatus(50)).toBe('medium')
    expect(factorStatus(20)).toBe('critical')
    expect(errorsToHealth(0)).toBe(100)
  })

  it('checkDockerConnection + getLogs — via child_process/dockerode fallback + Prisma', async () => {
    const dockerStatus = await checkDockerConnection()
    expect(dockerStatus).toHaveProperty('connected')
    expect(typeof dockerStatus.connected).toBe('boolean')
    // Should have either version or error
    expect(dockerStatus.version || dockerStatus.error).toBeDefined()

    const containers = await getDockerContainers(testProjectId)
    expect(Array.isArray(containers)).toBe(true)

    const logs = await getLogs(testProjectId, { limit: 10 })
    expect(Array.isArray(logs)).toBe(true)
    expect(logs.length).toBeLessThanOrEqual(10)
    if (logs.length > 0) {
      expect(logs[0]).toHaveProperty('id')
      expect(logs[0]).toHaveProperty('level')
      expect(logs[0]).toHaveProperty('message')
    }

    // Service logs
    const services = await prisma.dockerService.findMany({ where: { projectId: testProjectId }, take: 1 })
    if (services.length > 0) {
      const svcLogs = await getServiceLogs(services[0].id, 5)
      expect(Array.isArray(svcLogs)).toBe(true)
      expect(svcLogs.length).toBeLessThanOrEqual(5)
    }
  })
})
