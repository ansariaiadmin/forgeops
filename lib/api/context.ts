import type { Project } from '@prisma/client'

/**
 * Mock API layer for the Context Tree.
 *
 * Future REST surface (UI stays unchanged):
 *   GET  /api/projects/[slug]/context/tree
 *   GET  /api/projects/[slug]/context/file?path=src/app/page.tsx
 *   POST /api/projects/[slug]/context/analyze
 *   POST /api/projects/[slug]/context/pack
 */

// ─────────────────────────────── Types ───────────────────────────────

export interface ContextNode {
  path: string
  name: string
  type: 'file' | 'dir'
  /** Important project files get highlighted in the tree. */
  important?: boolean
  children?: ContextNode[]
}

export interface FileContent {
  path: string
  language: string
  content: string
  size: number
  lines: number
}

export interface TechDetection {
  name: string
  category: 'language' | 'framework' | 'tool'
  confidence: number
  hints: string[]
}

export interface ProjectAnalysis {
  entryPoint: string | null
  apis: string[]
  dependencies: string[]
  techStack: TechDetection[]
  analyzedAt: Date
}

export interface ContextPack {
  text: string
  fileCount: number
  charCount: number
  estimatedTokens: number
}

// ─────────────────────────────── Mock file system ───────────────────────────────

const IMPORTANT_FILES = new Set(['README.md', 'package.json', 'docker-compose.yml', '.env.example'])

const PROJECT_PATHS: Record<string, string[]> = {
  'proj-core': [
    'README.md',
    'package.json',
    'docker-compose.yml',
    '.env.example',
    '.gitignore',
    'Dockerfile',
    'tsconfig.json',
    'next.config.ts',
    'src/app/layout.tsx',
    'src/app/page.tsx',
    'src/app/globals.css',
    'src/app/api/health/route.ts',
    'src/app/api/deploy/route.ts',
    'src/components/dashboard.tsx',
    'src/components/header.tsx',
    'src/lib/db.ts',
    'src/lib/auth.ts',
    'src/utils/format.ts',
    'tests/e2e/deploy.spec.ts',
    'tests/unit/format.test.ts',
    'docs/architecture.md',
    'docs/api.md',
  ],
  'proj-api': [
    'README.md',
    'go.mod',
    'Dockerfile',
    '.env.example',
    'cmd/server/main.go',
    'internal/router/router.go',
    'internal/handlers/deploy.go',
    'internal/handlers/health.go',
    'internal/store/redis.go',
    'tests/integration/deploy_test.go',
    'docs/api.md',
  ],
}

const packageJson = JSON.stringify(
  {
    name: 'forge-core',
    version: '2.14.0',
    private: true,
    scripts: { dev: 'next dev', build: 'next build', start: 'next start' },
    dependencies: {
      next: '^15.5.0',
      react: '^19.1.0',
      'react-dom': '^19.1.0',
      zod: '^4.0.0',
      pino: '^9.0.0',
    },
    devDependencies: {
      typescript: '^5.8.0',
      tailwindcss: '^3.4.0',
      eslint: '^9.0.0',
      vitest: '^3.0.0',
    },
  },
  null,
  2,
)

const FILE_CONTENTS: Record<string, string> = {
  'README.md': [
    '# forge-core',
    '',
    'Core orchestration engine for ForgeOps — manages deployments, agents and environments.',
    '',
    '## Features',
    '',
    '- Multi-environment deployments (dev / staging / prod)',
    '- Agent orchestration with MCP tool access',
    '- Health monitoring with automatic rollbacks',
    '',
    '## Quick start',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
    '',
    '## Stack',
    '',
    '| Layer | Tech |',
    '| --- | --- |',
    '| Frontend | Next.js 15, React 19, Tailwind CSS |',
    '| Backend | Node.js, TypeScript |',
    '| Infra | Docker, Docker Compose |',
    '',
    '## API',
    '',
    'See [docs/api.md](docs/api.md).',
    '',
  ].join('\n'),
  'package.json': packageJson,
  'docker-compose.yml': [
    'services:',
    '  web:',
    '    image: forgeops/web:2.14.0',
    '    ports:',
    '      - "3000:80"',
    '    depends_on:',
    '      - db',
    '      - redis',
    '  db:',
    '    image: postgres:16-alpine',
    '    volumes:',
    '      - pgdata:/var/lib/postgresql/data',
    '  redis:',
    '    image: redis:7-alpine',
    'volumes:',
    '  pgdata:',
    '',
  ].join('\n'),
  '.env.example': [
    '# Runtime',
    'NODE_ENV=production',
    'LOG_LEVEL=info',
    'PORT=3000',
    '',
    '# Database',
    'DATABASE_URL=postgres://forgeops:change-me@db:5432/forgeops',
    '',
    '# Auth',
    'JWT_SECRET=change-me',
    'NEXTAUTH_SECRET=change-me',
    '',
  ].join('\n'),
  'tsconfig.json': JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        strict: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'preserve',
        paths: { '@/*': ['./*'] },
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx'],
    },
    null,
    2,
  ),
  'src/app/page.tsx': [
    "import { Suspense } from 'react'",
    "import { ProjectList } from '@/components/projects/list'",
    '',
    'export default function Home() {',
    '  return (',
    '    <main className="mx-auto max-w-5xl px-6 py-10">',
    '      <h1 className="text-2xl font-semibold tracking-tight">Workspace</h1>',
    '      <Suspense fallback={<div>Loading projects...</div>}>',
    '        <ProjectList />',
    '      </Suspense>',
    '    </main>',
    '  )',
    '}',
    '',
  ].join('\n'),
  'src/app/api/health/route.ts': [
    "import { NextResponse } from 'next/server'",
    '',
    'export async function GET() {',
    "  return NextResponse.json({ status: 'ok', uptime: process.uptime() })",
    '}',
    '',
  ].join('\n'),
  'src/app/api/deploy/route.ts': [
    "import { NextResponse } from 'next/server'",
    "import { z } from 'zod'",
    '',
    'const bodySchema = z.object({',
    '  project: z.string(),',
    "  environment: z.enum(['DEV', 'STAGING', 'PROD']),",
    '})',
    '',
    'export async function POST(request: Request) {',
    '  const body = bodySchema.safeParse(await request.json())',
    '  if (!body.success) return NextResponse.json({ error: body.error }, { status: 400 })',
    '  return NextResponse.json({ accepted: true, ...body.data }, { status: 202 })',
    '}',
    '',
  ].join('\n'),
  'src/lib/auth.ts': [
    "import { createHash } from 'node:crypto'",
    '',
    'export function hashToken(token: string): string {',
    "  return createHash('sha256').update(token).digest('hex')",
    '}',
    '',
    'export function redact(secret: string): string {',
    "  return secret.length > 8 ? secret.slice(0, 4) + '••••' : '••••'",
    '}',
    '',
  ].join('\n'),
  Dockerfile: [
    'FROM node:20-alpine AS base',
    'WORKDIR /app',
    '',
    'FROM base AS deps',
    'COPY package.json package-lock.json ./',
    'RUN npm ci',
    '',
    'FROM base AS build',
    'COPY --from=deps /app/node_modules ./node_modules',
    'COPY . .',
    'RUN npm run build',
    '',
    'FROM node:20-alpine AS runner',
    'COPY --from=build /app/.next ./.next',
    'EXPOSE 3000',
    'CMD ["npm", "start"]',
    '',
  ].join('\n'),
  'docs/architecture.md': [
    '# Architecture',
    '',
    '## Overview',
    '',
    'forge-core is split into three layers: **web** (Next.js), **api** (edge routes)',
    'and **worker** (background jobs).',
    '',
    '## Data flow',
    '',
    '1. Client calls `/api/deploy`',
    '2. Route validates with Zod and enqueues a job',
    '3. Worker picks up the job and talks to Docker',
    '',
    '> All secrets live in the environment, never in the repo.',
    '',
  ].join('\n'),
}

/** Build a nested tree from a flat list of paths. */
export function buildContextTree(paths: string[]): ContextNode[] {
  const root: ContextNode[] = []

  for (const path of paths.sort()) {
    const parts = path.split('/')
    let level = root
    let acc = ''

    parts.forEach((part, index) => {
      acc = acc ? `${acc}/${part}` : part
      const isFile = index === parts.length - 1
      let node = level.find((entry) => entry.path === acc)

      if (!node) {
        node = {
          path: acc,
          name: part,
          type: isFile ? 'file' : 'dir',
          important: !isFile ? undefined : IMPORTANT_FILES.has(part),
        }
        level.push(node)
      }
      if (!isFile) {
        node.children ??= []
        level = node.children
      }
    })
  }

  const sortNodes = (nodes: ContextNode[]): ContextNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    nodes.forEach((node) => node.children && sortNodes(node.children))
    return nodes
  }

  return sortNodes(root)
}

const FALLBACK_PATHS = ['README.md', 'package.json', 'Dockerfile', 'src/index.ts']

/** Fetch the context tree of a project (mock; real: GET .../context/tree). */
export async function getContextTree(projectId: string): Promise<ContextNode[]> {
  const paths = PROJECT_PATHS[projectId] ?? FALLBACK_PATHS
  return buildContextTree(paths)
}

const LANGUAGE_BY_EXT: Record<string, string> = {
  md: 'markdown',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  css: 'css',
  sh: 'bash',
  go: 'go',
  mod: 'go',
}

/** Map a file path to a highlighting language id. */
export function detectLanguage(path: string): string {
  const name = path.split('/').pop() ?? path
  const lower = name.toLowerCase()
  if (lower === 'dockerfile') return 'docker'
  if (lower.startsWith('.env')) return 'ini'
  if (lower === '.gitignore') return 'ini'
  const ext = lower.split('.').pop() ?? ''
  return LANGUAGE_BY_EXT[ext] ?? 'text'
}

/** Fetch a file's content (mock; real: GET .../context/file?path=). */
export async function getFileContent(projectId: string, path: string): Promise<FileContent | null> {
  const content = FILE_CONTENTS[path]
  if (content === undefined) return null
  return {
    path,
    language: detectLanguage(path),
    content,
    size: new Blob([content]).size,
    lines: content.split('\n').length,
  }
}

// ─────────────────────────────── Detection & analysis ───────────────────────────────

function detectTechStack(
  tree: ContextNode[],
  contents: Record<string, string | null>,
): TechDetection[] {
  const scores = new Map<
    string,
    { category: TechDetection['category']; count: number; hints: string[] }
  >()
  const bump = (name: string, category: TechDetection['category'], hint: string) => {
    const entry = scores.get(name) ?? { category, count: 0, hints: [] }
    entry.count += 1
    if (!entry.hints.includes(hint)) entry.hints.push(hint)
    scores.set(name, entry)
  }

  const paths = collectPaths(tree)

  if (paths.some((p) => /\.tsx?$/.test(p))) bump('TypeScript', 'language', '*.ts / *.tsx files')
  if (paths.some((p) => /\.tsx$/.test(p))) bump('React', 'framework', '*.tsx components')
  if (paths.some((p) => /\.(js|jsx)$/.test(p) && !/\.test\./.test(p))) {
    bump('JavaScript', 'language', '*.js files')
  }
  if (paths.some((p) => /\.go$/.test(p))) bump('Go', 'language', '*.go files')

  const pkg = contents['package.json']
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      const deps = { ...parsed.dependencies, ...parsed.devDependencies }
      if (deps['next']) bump('Next.js', 'framework', 'package.json → next')
      if (deps['react']) bump('React', 'framework', 'package.json → react')
      if (deps['tailwindcss']) bump('Tailwind CSS', 'framework', 'package.json → tailwindcss')
      if (deps['vitest']) bump('Vitest', 'tool', 'package.json → vitest')
      if (deps['typescript']) bump('TypeScript', 'language', 'package.json → typescript')
      if (deps['prisma']) bump('Prisma', 'tool', 'package.json → prisma')
      if (deps['zod']) bump('Zod', 'tool', 'package.json → zod')
    } catch {
      // not JSON — ignore
    }
  }
  if (paths.some((p) => p === 'Dockerfile')) bump('Docker', 'tool', 'Dockerfile')
  if (paths.some((p) => /docker-compose\.ya?ml/.test(p)))
    bump('Docker Compose', 'tool', 'docker-compose.yml')
  if (paths.some((p) => p === 'tsconfig.json')) bump('TypeScript', 'language', 'tsconfig.json')
  if (paths.some((p) => /\.test\.(ts|tsx|js)$/.test(p))) bump('Vitest', 'tool', '*.test.* files')

  return [...scores.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, info]) => ({
      name,
      category: info.category,
      confidence: Math.min(95, 55 + info.count * 12),
      hints: info.hints.slice(0, 3),
    }))
}

function collectPaths(tree: ContextNode[], acc: string[] = []): string[] {
  for (const node of tree) {
    acc.push(node.path)
    if (node.children) collectPaths(node.children, acc)
  }
  return acc
}

/** Analyze the project structure — entry point, APIs, dependencies, stack. */
export function analyzeProject(
  project: Project,
  tree: ContextNode[],
  contents: Record<string, string | null>,
): ProjectAnalysis {
  const paths = collectPaths(tree)

  const entryPoint =
    paths.find((p) => p === 'src/app/page.tsx') ??
    paths.find((p) => p === 'src/index.ts') ??
    paths.find((p) => p === 'cmd/server/main.go') ??
    null

  const apis = paths
    .filter((p) => /\/api\/.*\/route\.tsx?$/.test(p) || /\/handlers\/.*\.go$/.test(p))
    .map((p) => {
      const match = p.match(/\/api\/(.+)\/route\.tsx?$/)
      if (match) return `/api/${match[1]}`
      const handler = p.split('/').pop()?.replace(/\.go$/, '')
      return `/api/${handler}`
    })
    .sort()

  let dependencies: string[] = []
  const pkg = contents['package.json']
  if (pkg) {
    try {
      const parsed = JSON.parse(pkg) as {
        dependencies?: Record<string, string>
        devDependencies?: Record<string, string>
      }
      dependencies = Object.keys({ ...parsed.dependencies, ...parsed.devDependencies }).sort()
    } catch {
      // ignore
    }
  }

  return {
    entryPoint,
    apis,
    dependencies,
    techStack: detectTechStack(tree, contents),
    analyzedAt: new Date(),
  }
}

/** Build the AI context pack from all indexed files. */
export function buildContextPack(
  projectName: string,
  tree: ContextNode[],
  contents: Record<string, string | null>,
): ContextPack {
  const files = collectPaths(tree).filter((path) => contents[path] != null)

  const sections = files.map((path) => {
    const content = contents[path] ?? ''
    const language = detectLanguage(path)
    return `## File: ${path}\n\n\`\`\`${language}\n${content.replace(/```/g, '\\`\\`\\`')}\n\`\`\`\n`
  })

  const text = [
    `# Context Pack: ${projectName}`,
    '',
    `Generated for AI agents · ${files.length} files · ${new Date().toISOString()}`,
    '',
    ...sections,
  ].join('\n')

  return {
    text,
    fileCount: files.length,
    charCount: text.length,
    estimatedTokens: Math.ceil(text.length / 4),
  }
}

/** Fetch all indexed file contents for the pack/analysis (mock). */
export async function getProjectContents(
  tree: ContextNode[],
): Promise<Record<string, string | null>> {
  const contents: Record<string, string | null> = {}
  for (const path of collectPaths(tree)) {
    contents[path] = FILE_CONTENTS[path] ?? null
  }
  return contents
}
