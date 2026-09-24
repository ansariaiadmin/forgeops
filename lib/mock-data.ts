import type {
  Agent,
  AgentJob,
  AuditLog,
  DockerService,
  MCPConnection,
  Project,
} from '@prisma/client'

/**
 * Mock data layer for the dashboard.
 * Typed against the real Prisma models so it can be swapped for
 * live API calls later without touching the UI components.
 */

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000)

// ─────────────────────────────── Users ───────────────────────────────

export interface MockUser {
  id: string
  name: string
  email: string
}

export const mockUsers: MockUser[] = [
  { id: 'usr-aria', name: 'Aria Chen', email: 'aria@forgeops.dev' },
  { id: 'usr-john', name: 'John Alvarez', email: 'john@forgeops.dev' },
  { id: 'usr-maria', name: 'Maria Kim', email: 'maria@forgeops.dev' },
  { id: 'usr-sam', name: 'Sam Osei', email: 'sam@forgeops.dev' },
]

export function mockUserName(userId: string | null): string {
  return mockUsers.find((u) => u.id === userId)?.name ?? 'System'
}

// ─────────────────────────────── Projects ───────────────────────────────

export const mockProjects: Project[] = [
  {
    id: 'proj-core',
    name: 'forge-core',
    slug: 'forge-core',
    description: 'Core orchestration engine',
    workspaceId: 'ws-main',
    ownerId: 'usr-aria',
    status: 'ACTIVE',
    environment: 'PROD',
    techStack: ['TypeScript', 'Next.js', 'Docker'],
    healthScore: 92,
    createdAt: daysAgo(120),
    updatedAt: hoursAgo(2),
  },
  {
    id: 'proj-api',
    name: 'api-gateway',
    slug: 'api-gateway',
    description: 'Edge API gateway and routing',
    workspaceId: 'ws-main',
    ownerId: 'usr-aria',
    status: 'ACTIVE',
    environment: 'PROD',
    techStack: ['Go', 'Redis'],
    healthScore: 78,
    createdAt: daysAgo(98),
    updatedAt: minutesAgo(18),
  },
  {
    id: 'proj-front',
    name: 'frontend-web',
    slug: 'frontend-web',
    description: 'Customer-facing web app',
    workspaceId: 'ws-main',
    ownerId: 'usr-john',
    status: 'ACTIVE',
    environment: 'STAGING',
    techStack: ['React', 'Vite'],
    healthScore: 65,
    createdAt: daysAgo(80),
    updatedAt: hoursAgo(9),
  },
  {
    id: 'proj-ml',
    name: 'ml-inference',
    slug: 'ml-inference',
    description: 'ML inference service',
    workspaceId: 'ws-main',
    ownerId: 'usr-maria',
    status: 'ACTIVE',
    environment: 'STAGING',
    techStack: ['Python', 'PyTorch'],
    healthScore: 54,
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(12),
  },
  {
    id: 'proj-legacy',
    name: 'legacy-monolith',
    slug: 'legacy-monolith',
    description: 'Legacy monolith pending migration',
    workspaceId: 'ws-main',
    ownerId: 'usr-maria',
    status: 'ACTIVE',
    environment: 'PROD',
    techStack: ['PHP', 'MySQL'],
    healthScore: 32,
    createdAt: daysAgo(400),
    updatedAt: hoursAgo(30),
  },
  {
    id: 'proj-docs',
    name: 'docs-portal',
    slug: 'docs-portal',
    description: 'Developer documentation portal',
    workspaceId: 'ws-main',
    ownerId: 'usr-aria',
    status: 'ARCHIVED',
    environment: 'DEV',
    techStack: ['Next.js', 'MDX'],
    healthScore: 88,
    createdAt: daysAgo(200),
    updatedAt: daysAgo(14),
  },
  {
    id: 'proj-data',
    name: 'data-pipeline',
    slug: 'data-pipeline',
    description: 'ETL pipeline for analytics',
    workspaceId: 'ws-main',
    ownerId: 'usr-sam',
    status: 'ACTIVE',
    environment: 'DEV',
    techStack: ['Python', 'Airflow'],
    healthScore: 41,
    createdAt: daysAgo(45),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'proj-analytics',
    name: 'analytics-dashboard',
    slug: 'analytics-dashboard',
    description: 'Real-time product analytics for the platform',
    workspaceId: 'ws-main',
    ownerId: 'usr-sam',
    status: 'ACTIVE',
    environment: 'PROD',
    techStack: ['React', 'PostgreSQL', 'Redis'],
    healthScore: 71,
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'proj-mobile',
    name: 'mobile-app',
    slug: 'mobile-app',
    description: 'Cross-platform mobile client (archived)',
    workspaceId: 'ws-main',
    ownerId: 'usr-john',
    status: 'ARCHIVED',
    environment: 'DEV',
    techStack: ['TypeScript', 'React'],
    healthScore: 45,
    createdAt: daysAgo(150),
    updatedAt: daysAgo(20),
  },
  {
    id: 'proj-billing',
    name: 'legacy-billing',
    slug: 'legacy-billing',
    description: 'Deprecated billing system — replaced by forge-core',
    workspaceId: 'ws-main',
    ownerId: 'usr-maria',
    status: 'DELETED',
    environment: 'PROD',
    techStack: ['Java', 'MySQL'],
    healthScore: 12,
    createdAt: daysAgo(500),
    updatedAt: daysAgo(60),
  },
]

// ─────────────────────────────── Services ───────────────────────────────

export const mockServices: DockerService[] = [
  {
    id: 'svc-web',
    projectId: 'proj-core',
    name: 'web',
    image: 'forgeops/web:2.14.0',
    containerId: 'c1a2b3',
    status: 'RUNNING',
    ports: { '3000': '80' },
    volumes: ['/app/public'],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(30),
    updatedAt: minutesAgo(5),
  },
  {
    id: 'svc-api',
    projectId: 'proj-api',
    name: 'api',
    image: 'forgeops/api:2.14.0',
    containerId: 'd4e5f6',
    status: 'RUNNING',
    ports: { '8080': '8080' },
    volumes: [],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(30),
    updatedAt: minutesAgo(5),
  },
  {
    id: 'svc-worker',
    projectId: 'proj-api',
    name: 'worker',
    image: 'forgeops/worker:2.13.1',
    containerId: 'g7h8i9',
    status: 'RUNNING',
    ports: {},
    volumes: ['/tmp/jobs'],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(30),
    updatedAt: minutesAgo(5),
  },
  {
    id: 'svc-db',
    projectId: 'proj-core',
    name: 'db',
    image: 'postgres:16-alpine',
    containerId: 'j0k1l2',
    status: 'RUNNING',
    ports: { '5432': '5432' },
    volumes: ['pgdata:/var/lib/postgresql/data'],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(120),
    updatedAt: minutesAgo(1),
  },
  {
    id: 'svc-worker-core',
    projectId: 'proj-core',
    name: 'worker',
    image: 'forgeops/worker:2.13.0',
    containerId: 'm7n8o9',
    status: 'RUNNING',
    ports: {},
    volumes: ['/tmp/artifacts'],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(60),
    updatedAt: minutesAgo(3),
  },
  {
    id: 'svc-backup-core',
    projectId: 'proj-core',
    name: 'backup-runner',
    image: 'forgeops/backup:1.0.3',
    containerId: 'p0q1r2',
    status: 'STOPPED',
    ports: {},
    volumes: ['/backups'],
    networks: ['forge-net'],
    healthStatus: 'stopped',
    createdAt: daysAgo(45),
    updatedAt: daysAgo(1),
  },
  {
    id: 'svc-redis',
    projectId: 'proj-api',
    name: 'redis',
    image: 'redis:7-alpine',
    containerId: 'm3n4o5',
    status: 'RUNNING',
    ports: { '6379': '6379' },
    volumes: ['redisdata:/data'],
    networks: ['forge-net'],
    healthStatus: 'healthy',
    createdAt: daysAgo(98),
    updatedAt: minutesAgo(1),
  },
  {
    id: 'svc-ml',
    projectId: 'proj-ml',
    name: 'ml-service',
    image: 'forgeops/ml:0.9.4',
    containerId: 'p6q7r8',
    status: 'STOPPED',
    ports: { '8000': '8000' },
    volumes: [],
    networks: ['forge-net'],
    healthStatus: 'stopped',
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(14),
  },
  {
    id: 'svc-cron',
    projectId: 'proj-data',
    name: 'cron-scheduler',
    image: 'forgeops/cron:1.2.0',
    containerId: 's9t0u1',
    status: 'ERROR',
    ports: {},
    volumes: [],
    networks: ['forge-net'],
    healthStatus: 'unhealthy',
    createdAt: daysAgo(45),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'svc-cache',
    projectId: 'proj-front',
    name: 'cache',
    image: 'memcached:1.6',
    containerId: 'v2w3x4',
    status: 'STOPPED',
    ports: { '11211': '11211' },
    volumes: [],
    networks: ['forge-net'],
    healthStatus: 'stopped',
    createdAt: daysAgo(80),
    updatedAt: daysAgo(2),
  },
]

// ─────────────────────────────── Agents ───────────────────────────────

export const mockAgents: Agent[] = [
  {
    id: 'agt-builder',
    name: 'Builder',
    type: 'DEVELOPER',
    projectId: 'proj-core',
    model: 'gpt-4o',
    systemPrompt: 'You are a senior software engineer working on forge-core.',
    tools: ['read_file', 'write_file', 'run_command'],
    mcpIds: ['mcp-github'],
    status: 'RUNNING',
    totalTokensUsed: 1_284_000,
    totalCost: 12.84,
    createdAt: daysAgo(90),
    updatedAt: minutesAgo(2),
  },
  {
    id: 'agt-deploy',
    name: 'DeployBot',
    type: 'DEVOPS',
    projectId: null,
    model: 'gpt-4o-mini',
    systemPrompt: 'You handle deployments and rollbacks across environments.',
    tools: ['deploy', 'rollback', 'logs'],
    mcpIds: ['mcp-k8s'],
    status: 'RUNNING',
    totalTokensUsed: 842_000,
    totalCost: 4.21,
    createdAt: daysAgo(90),
    updatedAt: minutesAgo(18),
  },
  {
    id: 'agt-review',
    name: 'Reviewer',
    type: 'REVIEWER',
    projectId: 'proj-core',
    model: 'gpt-4o',
    systemPrompt: 'You review pull requests for correctness and security.',
    tools: ['read_file', 'git_diff'],
    mcpIds: ['mcp-github'],
    status: 'IDLE',
    totalTokensUsed: 512_000,
    totalCost: 5.12,
    createdAt: daysAgo(75),
    updatedAt: hoursAgo(4),
  },
  {
    id: 'agt-docs',
    name: 'DocsWriter',
    type: 'DOCUMENTER',
    projectId: 'proj-docs',
    model: 'gpt-4o-mini',
    systemPrompt: 'You maintain project documentation in Markdown.',
    tools: ['write_file'],
    mcpIds: [],
    status: 'IDLE',
    totalTokensUsed: 210_000,
    totalCost: 1.05,
    createdAt: daysAgo(60),
    updatedAt: daysAgo(1),
  },
  {
    id: 'agt-pm',
    name: 'ProductMind',
    type: 'PRODUCT',
    projectId: 'proj-front',
    model: 'gpt-4o',
    systemPrompt: 'You translate requirements into actionable tasks.',
    tools: ['create_task'],
    mcpIds: [],
    status: 'ERROR',
    totalTokensUsed: 96_000,
    totalCost: 0.96,
    createdAt: daysAgo(40),
    updatedAt: hoursAgo(7),
  },
]

// ─────────────────────────────── Agent jobs ───────────────────────────────

export const mockJobs: AgentJob[] = [
  {
    id: 'job-2841',
    agentId: 'agt-builder',
    projectId: 'proj-core',
    task: 'Fix flaky e2e test in checkout flow',
    status: 'SUCCESS',
    result: 'Resolved 3 race conditions; all 48 tests green.',
    error: null,
    tokensUsed: 12_400,
    cost: 0.12,
    startedAt: hoursAgo(1.5),
    completedAt: hoursAgo(1.1),
  },
  {
    id: 'job-2842',
    agentId: 'agt-deploy',
    projectId: 'proj-api',
    task: 'Deploy api-gateway v2.14.0 to production',
    status: 'SUCCESS',
    result: 'Rollout completed in 94s. 0 errors in first 5 minutes.',
    error: null,
    tokensUsed: 4_100,
    cost: 0.04,
    startedAt: hoursAgo(0.6),
    completedAt: minutesAgo(18),
  },
  {
    id: 'job-2843',
    agentId: 'agt-builder',
    projectId: 'proj-front',
    task: 'Add optimistic UI to project list',
    status: 'SUCCESS',
    result: 'Implemented with rollback on failure.',
    error: null,
    tokensUsed: 9_800,
    cost: 0.1,
    startedAt: hoursAgo(4),
    completedAt: hoursAgo(3.2),
  },
  {
    id: 'job-2844',
    agentId: 'agt-deploy',
    projectId: 'proj-ml',
    task: 'Migrate DB schema for tasks table',
    status: 'FAILED',
    result: null,
    error: 'Migration timeout after 120s (lock on tasks table)',
    tokensUsed: 2_300,
    cost: 0.02,
    startedAt: hoursAgo(6),
    completedAt: hoursAgo(5.7),
  },
  {
    id: 'job-2845',
    agentId: 'agt-review',
    projectId: 'proj-core',
    task: 'Review PR #482 — auth refactor',
    status: 'SUCCESS',
    result: '2 minor nits; no blockers.',
    error: null,
    tokensUsed: 6_200,
    cost: 0.06,
    startedAt: hoursAgo(8),
    completedAt: hoursAgo(7.5),
  },
  {
    id: 'job-2846',
    agentId: 'agt-builder',
    projectId: 'proj-legacy',
    task: 'Extract payment module from monolith',
    status: 'FAILED',
    result: null,
    error: 'Circular dependency between billing and subscription modules',
    tokensUsed: 15_100,
    cost: 0.15,
    startedAt: hoursAgo(10),
    completedAt: hoursAgo(9.2),
  },
  {
    id: 'job-2847',
    agentId: 'agt-docs',
    projectId: 'proj-docs',
    task: 'Rewrite onboarding guide for v2',
    status: 'SUCCESS',
    result: 'Guide published; 14 pages.',
    error: null,
    tokensUsed: 5_400,
    cost: 0.05,
    startedAt: hoursAgo(12),
    completedAt: hoursAgo(11.4),
  },
  {
    id: 'job-2848',
    agentId: 'agt-deploy',
    projectId: 'proj-data',
    task: 'Rollback cron-scheduler to 1.1.9',
    status: 'SUCCESS',
    result: 'Rolled back; scheduler healthy again.',
    error: null,
    tokensUsed: 1_900,
    cost: 0.02,
    startedAt: hoursAgo(14),
    completedAt: hoursAgo(13.6),
  },
]

// ─────────────────────────────── Audit log ───────────────────────────────

export const mockAuditLogs: AuditLog[] = [
  {
    id: 'log-01',
    userId: 'usr-aria',
    projectId: 'proj-api',
    action: 'deployment.completed',
    resource: 'api-gateway:prod',
    details: { version: 'v2.14.0', duration: '94s' },
    ip: '10.0.0.5',
    userAgent: 'ForgeOps CLI/0.4.2',
    createdAt: minutesAgo(16),
  },
  {
    id: 'log-02',
    userId: 'usr-john',
    projectId: 'proj-core',
    action: 'agent.job.completed',
    resource: 'builder:job-2841',
    details: { status: 'SUCCESS', tokensUsed: 12400 },
    ip: '10.0.0.12',
    userAgent: 'ForgeOps Agent/1.0',
    createdAt: hoursAgo(1),
  },
  {
    id: 'log-03',
    userId: 'usr-maria',
    projectId: 'proj-data',
    action: 'project.created',
    resource: 'data-pipeline',
    details: { workspace: 'ws-main' },
    ip: '10.0.0.9',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: hoursAgo(2),
  },
  {
    id: 'log-04',
    userId: 'usr-aria',
    projectId: null,
    action: 'auth.login',
    resource: 'session',
    details: { method: 'credentials' },
    ip: '10.0.0.5',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: hoursAgo(3),
  },
  {
    id: 'log-05',
    userId: 'usr-sam',
    projectId: 'proj-core',
    action: 'mcp.connected',
    resource: 'github:forge-org',
    details: { scopes: ['repo', 'actions'] },
    ip: '10.0.0.21',
    userAgent: 'ForgeOps CLI/0.4.2',
    createdAt: hoursAgo(5),
  },
  {
    id: 'log-06',
    userId: 'usr-aria',
    projectId: 'proj-api',
    action: 'backup.completed',
    resource: 'prod-db',
    details: { size: 2147483648 },
    ip: '10.0.0.5',
    userAgent: 'ForgeOps Scheduler/1.0',
    createdAt: hoursAgo(7),
  },
  {
    id: 'log-07',
    userId: 'usr-john',
    projectId: 'proj-front',
    action: 'task.status_changed',
    resource: 'task:42',
    details: { from: 'BACKLOG', to: 'RUNNING' },
    ip: '10.0.0.12',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: hoursAgo(9),
  },
  {
    id: 'log-08',
    userId: 'usr-maria',
    projectId: 'proj-ml',
    action: 'deployment.failed',
    resource: 'ml-inference:staging',
    details: { reason: 'healthcheck_timeout' },
    ip: '10.0.0.9',
    userAgent: 'ForgeOps CLI/0.4.2',
    createdAt: hoursAgo(12),
  },
  {
    id: 'log-09',
    userId: 'usr-sam',
    projectId: 'proj-core',
    action: 'env.updated',
    resource: 'API_KEY',
    details: { environment: 'STAGING' },
    ip: '10.0.0.21',
    userAgent: 'Mozilla/5.0 (Linux)',
    createdAt: daysAgo(1),
  },
  {
    id: 'log-10',
    userId: 'usr-aria',
    projectId: 'proj-docs',
    action: 'project.archived',
    resource: 'docs-portal',
    details: { reason: 'replaced_by_wiki' },
    ip: '10.0.0.5',
    userAgent: 'Mozilla/5.0 (Macintosh)',
    createdAt: daysAgo(1),
  },
  {
    id: 'log-11',
    userId: 'usr-aria',
    projectId: null,
    action: 'agent.created',
    resource: 'docs-writer',
    details: { type: 'DOCUMENTER' },
    ip: '10.0.0.5',
    userAgent: 'ForgeOps CLI/0.4.2',
    createdAt: daysAgo(2),
  },
  {
    id: 'log-12',
    userId: null,
    projectId: null,
    action: 'auth.failed',
    resource: 'session',
    details: { reason: 'invalid_password' },
    ip: '203.0.113.44',
    userAgent: 'Mozilla/5.0 (Windows)',
    createdAt: daysAgo(2),
  },
]

// ─────────────────────────────── Derived stats ───────────────────────────────

export interface DashboardStats {
  totalProjects: number
  runningServices: number
  totalServices: number
  activeAgents: number
  avgHealthScore: number
  healthyProjects: number
  attentionProjects: number
  jobsSucceededToday: number
  jobsFailedToday: number
}

export function getDashboardStats(): DashboardStats {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const totalProjects = mockProjects.length
  const runningServices = mockServices.filter((s) => s.status === 'RUNNING').length
  const activeAgents = mockAgents.filter((a) => a.status === 'RUNNING').length
  const avgHealthScore = Math.round(
    mockProjects.reduce((sum, p) => sum + p.healthScore, 0) / mockProjects.length,
  )
  const healthyProjects = mockProjects.filter((p) => p.healthScore >= 70).length
  const attentionProjects = mockProjects.filter((p) => p.healthScore < 40).length

  const todayJobs = mockJobs.filter((j) => j.completedAt && j.completedAt >= today)
  const jobsSucceededToday = todayJobs.filter((j) => j.status === 'SUCCESS').length
  const jobsFailedToday = todayJobs.filter((j) => j.status === 'FAILED').length

  return {
    totalProjects,
    runningServices,
    totalServices: mockServices.length,
    activeAgents,
    avgHealthScore,
    healthyProjects,
    attentionProjects,
    jobsSucceededToday,
    jobsFailedToday,
  }
}

export type HealthLevel = 'good' | 'medium' | 'critical'

/** Map a health score (0–100) to a level. */
export function getHealthLevel(score: number): HealthLevel {
  if (score >= 70) return 'good'
  if (score >= 40) return 'medium'
  return 'critical'
}

export const HEALTH_LABEL: Record<HealthLevel, string> = {
  good: 'Good',
  medium: 'Fair',
  critical: 'Attention',
}

// ─────────────────────────────── MCP connections ───────────────────────────────

export const mockMcpConnections: MCPConnection[] = [
  {
    id: 'mcp-github',
    projectId: 'proj-core',
    name: 'GitHub',
    type: 'github',
    status: 'CONNECTED',
    config: { repo: 'forge-org/forge-core' },
    allowedTools: ['read_file', 'create_pr'],
    scopes: ['repo', 'actions'],
    lastConnectedAt: hoursAgo(3),
    createdAt: daysAgo(90),
    updatedAt: hoursAgo(3),
  },
  {
    id: 'mcp-k8s',
    projectId: 'proj-core',
    name: 'Kubernetes',
    type: 'kubernetes',
    status: 'CONNECTED',
    config: { cluster: 'forge-prod' },
    allowedTools: ['get_pods', 'scale'],
    scopes: ['deploy', 'read'],
    lastConnectedAt: hoursAgo(5),
    createdAt: daysAgo(80),
    updatedAt: hoursAgo(5),
  },
  {
    id: 'mcp-postgres',
    projectId: 'proj-core',
    name: 'Postgres',
    type: 'postgres',
    status: 'CONNECTED',
    config: { database: 'forgeops' },
    allowedTools: ['query'],
    scopes: ['read', 'write'],
    lastConnectedAt: hoursAgo(1),
    createdAt: daysAgo(60),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'mcp-redis',
    projectId: 'proj-core',
    name: 'Redis',
    type: 'redis',
    status: 'DISCONNECTED',
    config: { url: 'redis://redis:6379' },
    allowedTools: ['get', 'set'],
    scopes: ['read', 'write'],
    lastConnectedAt: daysAgo(7),
    createdAt: daysAgo(45),
    updatedAt: daysAgo(7),
  },
  {
    id: 'mcp-fs',
    projectId: 'proj-core',
    name: 'Filesystem',
    type: 'filesystem',
    status: 'CONNECTED',
    config: { root: '/workspace/forge-core' },
    allowedTools: ['read_file', 'write_file'],
    scopes: ['project_only'],
    lastConnectedAt: hoursAgo(6),
    createdAt: daysAgo(30),
    updatedAt: hoursAgo(6),
  },
  {
    id: 'mcp-slack',
    projectId: 'proj-api',
    name: 'Slack',
    type: 'slack',
    status: 'ERROR',
    config: { channel: '#deploys' },
    allowedTools: ['post_message'],
    scopes: ['write'],
    lastConnectedAt: daysAgo(3),
    createdAt: daysAgo(40),
    updatedAt: daysAgo(1),
  },
]

// ─────────────────────────────── Tech stack ───────────────────────────────

/** Selectable tech stack options for the project form. */
export const TECH_OPTIONS = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
  'Rust',
  'Java',
  'Next.js',
  'React',
  'Vue',
  'Node.js',
  'Docker',
  'Kubernetes',
  'PostgreSQL',
  'Redis',
  'MySQL',
  'MongoDB',
  'GraphQL',
  'Terraform',
  'AWS',
  'Tailwind',
] as const

interface TechMeta {
  short: string
  className: string
}

const TECH_META_MAP: Record<string, TechMeta> = {
  TypeScript: { short: 'TS', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  JavaScript: { short: 'JS', className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' },
  Python: { short: 'PY', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  Go: { short: 'GO', className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
  Rust: { short: 'RS', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  Java: { short: 'JV', className: 'bg-red-500/10 text-red-600 dark:text-red-400' },
  'Next.js': { short: 'NX', className: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400' },
  React: { short: 'RC', className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  Vue: { short: 'VU', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  'Node.js': { short: 'ND', className: 'bg-lime-500/10 text-lime-600 dark:text-lime-400' },
  Docker: { short: 'DK', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  Kubernetes: { short: 'K8', className: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  PostgreSQL: { short: 'PG', className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  Redis: { short: 'RD', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  MySQL: { short: 'MY', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400' },
  MongoDB: { short: 'MG', className: 'bg-green-500/10 text-green-600 dark:text-green-400' },
  GraphQL: { short: 'GQ', className: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  Terraform: { short: 'TF', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  AWS: { short: 'AW', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  Tailwind: { short: 'TW', className: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' },
}

const FALLBACK_META: TechMeta = { short: '?', className: 'bg-muted text-muted-foreground' }

/** Metadata (monogram + tint) for a tech name; falls back to a neutral chip. */
export function techMeta(tech: string): TechMeta {
  return (
    TECH_META_MAP[tech] ?? {
      ...FALLBACK_META,
      short: tech.slice(0, 2).toUpperCase(),
    }
  )
}
