import type { Metadata } from 'next'
import { Plug } from 'lucide-react'

import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = {
  title: 'MCP Hub',
}

export default function McpHubPage() {
  return (
    <PlaceholderPage
      title="MCP Hub"
      description="Connect external tools and services through MCP connections."
      icon={Plug}
    />
  )
}
