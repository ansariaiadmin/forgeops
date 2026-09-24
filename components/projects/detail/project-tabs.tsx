import dynamic from 'next/dynamic'
import {
  BookOpen,
  Bot,
  Brain,
  Container,
  FolderTree,
  HeartPulse,
  Plug,
  ScanSearch,
} from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ProjectDetail } from '@/lib/api/projects'

const tabSkeleton = (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
    <Skeleton className="h-96 w-full lg:col-span-4" />
    <Skeleton className="h-96 w-full lg:col-span-8" />
    <Skeleton className="h-80 w-full lg:col-span-12" />
  </div>
)

// Heavy tabs are lazy-loaded (react-arborist, easymde, recharts, patternfly-free
// log viewer) so each ships only when the user opens it — keeps the initial
// bundle of /projects/[slug] lean.
const DockerServicesTab = dynamic(
  () =>
    import('@/components/projects/detail/tabs/docker-services-tab').then(
      (module) => module.DockerServicesTab,
    ),
  { loading: () => tabSkeleton },
)
const ContextTreeTab = dynamic(
  () =>
    import('@/components/projects/detail/tabs/context-tree-tab').then(
      (module) => module.ContextTreeTab,
    ),
  { loading: () => <Skeleton className="h-[560px] w-full" /> },
)
const MemoryTab = dynamic(
  () => import('@/components/projects/detail/tabs/memory-tab').then((module) => module.MemoryTab),
  { loading: () => <Skeleton className="h-80 w-full" /> },
)
const RagTab = dynamic(
  () => import('@/components/projects/detail/tabs/rag-tab').then((module) => module.RagTab),
  { loading: () => <Skeleton className="h-80 w-full" /> },
)
const McpHubTab = dynamic(
  () =>
    import('@/components/projects/detail/tabs/mcp/mcp-hub-tab').then(
      (module) => module.McpHubTab,
    ),
  { loading: () => <Skeleton className="h-80 w-full" /> },
)
const DocsTab = dynamic(
  () => import('@/components/projects/detail/tabs/docs/docs-tab').then((module) => module.DocsTab),
  { loading: () => <Skeleton className="h-80 w-full" /> },
)
const AgentsTab = dynamic(
  () =>
    import('@/components/projects/detail/tabs/agents/agents-tab').then(
      (module) => module.AgentsTab,
    ),
  { loading: () => <Skeleton className="h-80 w-full" /> },
)
const HealthLogsTab = dynamic(
  () =>
    import('@/components/projects/detail/tabs/health/health-logs-tab').then(
      (module) => module.HealthLogsTab,
    ),
  { loading: () => tabSkeleton },
)

/**
 * Tab navigation for the project detail page. All eight tabs are isolated
 * components; heavy ones are code-split via next/dynamic.
 */
export function ProjectTabs({ detail }: { detail: ProjectDetail }) {
  const { project, services, agents } = detail

  return (
    <Tabs defaultValue="services" className="w-full">
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1">
        <TabsTrigger value="services">
          <Container />
          Docker Services
        </TabsTrigger>
        <TabsTrigger value="context">
          <FolderTree />
          Context Tree
        </TabsTrigger>
        <TabsTrigger value="memory">
          <Brain />
          Memory
        </TabsTrigger>
        <TabsTrigger value="rag">
          <ScanSearch />
          RAG
        </TabsTrigger>
        <TabsTrigger value="mcp">
          <Plug />
          MCP Hub
        </TabsTrigger>
        <TabsTrigger value="docs">
          <BookOpen />
          Docs
        </TabsTrigger>
        <TabsTrigger value="agents">
          <Bot />
          Agents
        </TabsTrigger>
        <TabsTrigger value="health">
          <HeartPulse />
          Health & Logs
        </TabsTrigger>
      </TabsList>

      <TabsContent value="services">
        <DockerServicesTab project={project} services={services} />
      </TabsContent>
      <TabsContent value="context">
        <ContextTreeTab project={project} />
      </TabsContent>
      <TabsContent value="memory">
        <MemoryTab project={project} />
      </TabsContent>
      <TabsContent value="rag">
        <RagTab project={project} />
      </TabsContent>
      <TabsContent value="mcp">
        <McpHubTab project={project} />
      </TabsContent>
      <TabsContent value="docs">
        <DocsTab project={project} />
      </TabsContent>
      <TabsContent value="agents">
        <AgentsTab project={project} agents={agents} />
      </TabsContent>
      <TabsContent value="health">
        <HealthLogsTab project={project} />
      </TabsContent>
    </Tabs>
  )
}
