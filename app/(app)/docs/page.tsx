import type { Metadata } from 'next'
import { BookOpen } from 'lucide-react'

import { PlaceholderPage } from '@/components/placeholder-page'

export const metadata: Metadata = {
  title: 'Docs',
}

export default function DocsPage() {
  return (
    <PlaceholderPage
      title="Docs"
      description="Project documentation, guides and API references."
      icon={BookOpen}
    />
  )
}
