import { AppHeader } from '@/components/layout/app-header'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

/**
 * Layout for authenticated app pages: collapsible sidebar (240px),
 * 64px header and a scrollable main content area.
 * Not applied to /auth/* (they live in their own route group).
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh">
        <AppHeader />
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
