import type { Metadata } from 'next'
import { Bot } from 'lucide-react'

import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = {
  title: 'Agents',
}

export default function AgentsPage() {
  return (
    <PlaceholderPage
      title="Agents"
      description="Create and manage AI agents for development, devops and reviews."
      icon={Bot}
    />
  )
}
