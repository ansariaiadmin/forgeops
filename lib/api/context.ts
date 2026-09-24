import type { Project } from '@prisma/client'

import { prisma } from '@/lib/prisma'

// ─────────────────────────────── Types ───────────────────────────────

export interface ContextNode {
  path: string
  name: string
  type: 'file' | 'dir'
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

// ─────────────────────────────── Real Prisma + filesystem (server-safe) ───────────────────────────────

const IMPORTANT_FILES = new Set(['README.md', 'package.json', 'docker-compose.yml', '.env.example'])

export function buildContextTree(paths: string[]): ContextNode[] {
  const root: ContextNode[] = []

  for (const filePath of paths.sort()) {
    const parts = filePath.split('/')
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

export async function getContextTree(projectId: string): Promise<ContextNode[]> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) {
    return buildContextTree(['README.md', 'package.json', 'Dockerfile'])
  }

  // In production, list real files from project's repo.
  // For now, build tree from documents + tech stack.
  const docs = await prisma.document.findMany({ where: { projectId } })
  const docPaths = docs.map((d) => d.path)

  const techStack = Array.isArray(project.techStack) ? (project.techStack as string[]) : []
  const fallback = [
    'README.md',
    'package.json',
    'docker-compose.yml',
    'src/app/page.tsx',
    'src/app/layout.tsx',
    ...docPaths,
    ...techStack.map((t) => `src/${t.toLowerCase()}/index.ts`),
  ]

  const unique = [...new Set(fallback)].slice(0, 100)
  return buildContextTree(unique)
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

export function detectLanguage(filePath: string): string {
  const name = filePath.split('/').pop() ?? filePath
  const lower = name.toLowerCase()
  if (lower === 'dockerfile') return 'docker'
  if (lower.startsWith('.env')) return 'ini'
  if (lower === '.gitignore') return 'ini'
  const ext = lower.split('.').pop() ?? ''
  return LANGUAGE_BY_EXT[ext] ?? 'text'
}

export async function getFileContent(projectId: string, filePath: string): Promise<FileContent | null> {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) return null

  const doc = await prisma.document.findFirst({
    where: { projectId, path: filePath },
  })
  if (doc) {
    return {
      path: filePath,
      language: detectLanguage(filePath),
      content: doc.content,
      size: Buffer.byteLength(doc.content),
      lines: doc.content.split('\n').length,
    }
  }

  return null
}

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
      // ignore
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

export function buildContextPack(
  projectName: string,
  tree: ContextNode[],
  contents: Record<string, string | null>,
): ContextPack {
  const files = collectPaths(tree).filter((p) => contents[p] != null)

  const sections = files.map((filePath) => {
    const content = contents[filePath] ?? ''
    const language = detectLanguage(filePath)
    return `## File: ${filePath}\n\n\`\`\`${language}\n${content.replace(/```/g, '\\`\\`\\`')}\n\`\`\`\n`
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

export async function getProjectContents(
  tree: ContextNode[],
): Promise<Record<string, string | null>> {
  const contents: Record<string, string | null> = {}
  for (const filePath of collectPaths(tree)) {
    const doc = await prisma.document.findFirst({
      where: { path: filePath },
    })
    contents[filePath] = doc?.content ?? null
  }
  return contents
}
