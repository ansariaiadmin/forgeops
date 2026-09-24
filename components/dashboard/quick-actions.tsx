import Link from 'next/link'
import { Bot, FolderOpen, Plus, Plug } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Quick action shortcuts. Create buttons are wired to future modals;
 * "View All Projects" navigates to the projects page.
 */
export function QuickActions() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2.5">
        <Button className="justify-start gap-2" title="Coming soon">
          <Plus />
          New Project
        </Button>
        <Button variant="outline" className="justify-start gap-2" title="Coming soon">
          <Bot />
          New Agent
        </Button>
        <Button variant="outline" className="justify-start gap-2" title="Coming soon">
          <Plug />
          Connect MCP
        </Button>
        <Button variant="ghost" asChild className="justify-start gap-2">
          <Link href="/projects">
            <FolderOpen />
            View All Projects
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
