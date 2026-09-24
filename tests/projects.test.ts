import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  getAllProjects,
  getProjectBySlug,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '@/lib/api/projects'

let testWorkspaceId: string
let testUserId: string
let createdProjectId: string
const TEST_SLUG = `test-proj-${Date.now()}`

describe('Projects API — real Prisma integration', () => {
  beforeAll(async () => {
    const workspace = await prisma.workspace.findFirst()
    const user = await prisma.user.findFirst()
    if (!workspace || !user) throw new Error('Seed required — run npm run db:seed')
    testWorkspaceId = workspace.id
    testUserId = user.id
  })

  afterAll(async () => {
    // Cleanup test project if still exists
    if (createdProjectId) {
      await prisma.project.delete({ where: { id: createdProjectId } }).catch(() => {})
    }
    await prisma.$disconnect()
  })

  it('findMany — returns projects with counts (include agents/docs)', async () => {
    const projects = await getAllProjects()
    expect(Array.isArray(projects)).toBe(true)
    expect(projects.length).toBeGreaterThan(0)
    // Check that counts are present
    const first = projects[0] as any
    expect(first).toHaveProperty('servicesCount')
    expect(first).toHaveProperty('agentsCount')
  })

  it('findUnique — include relations (owner, dockerServices, agents, documents)', async () => {
    const projects = await prisma.project.findMany({ take: 1 })
    const slug = projects[0].slug
    const detail = await getProjectBySlug(slug)
    expect(detail).not.toBeNull()
    expect(detail).toHaveProperty('owner')
    expect(detail).toHaveProperty('dockerServices')
    expect(detail).toHaveProperty('agents')
    expect(detail).toHaveProperty('documents')
    expect(detail).toHaveProperty('memories')
  })

  it('create — with validation (slug unique, name length)', async () => {
    const project = await createProject({
      name: 'Test Project For Vitest',
      slug: TEST_SLUG,
      description: 'Created by vitest',
      environment: 'DEV',
      techStack: ['Next.js', 'Prisma'],
      workspaceId: testWorkspaceId,
      ownerId: testUserId,
    })

    createdProjectId = project.id
    expect(project.slug).toBe(TEST_SLUG)
    expect(project.name).toBe('Test Project For Vitest')

    // Validation: duplicate slug should fail
    await expect(
      createProject({
        name: 'Duplicate',
        slug: TEST_SLUG,
        environment: 'DEV',
        workspaceId: testWorkspaceId,
        ownerId: testUserId,
      }),
    ).rejects.toThrow()

    // Validation: invalid slug format
    await expect(
      createProject({
        name: 'Bad Slug',
        slug: 'INVALID_SLUG',
        environment: 'DEV',
        workspaceId: testWorkspaceId,
        ownerId: testUserId,
      }),
    ).rejects.toThrow()
  })

  it('update — partial fields', async () => {
    const updated = await updateProject(createdProjectId, {
      name: 'Updated Test Project',
      description: 'Updated description',
      environment: 'STAGING',
    })

    expect(updated.name).toBe('Updated Test Project')
    expect(updated.environment).toBe('STAGING')

    const fetched = await getProjectById(createdProjectId)
    expect(fetched?.description).toBe('Updated description')
  })

  it('delete — cascade to children (services, memories, etc.)', async () => {
    // Create a service under this project to test cascade
    await prisma.dockerService.create({
      data: {
        projectId: createdProjectId,
        name: `svc-test-${Date.now()}`,
        image: 'nginx:alpine',
        status: 'STOPPED',
        healthStatus: 'stopped',
      },
    })

    const servicesBefore = await prisma.dockerService.count({ where: { projectId: createdProjectId } })
    expect(servicesBefore).toBeGreaterThan(0)

    await deleteProject(createdProjectId)

    const after = await prisma.project.findUnique({ where: { id: createdProjectId } })
    expect(after).toBeNull()

    const servicesAfter = await prisma.dockerService.count({ where: { projectId: createdProjectId } })
    expect(servicesAfter).toBe(0)

    // Reset for afterAll
    createdProjectId = ''
  })
})
