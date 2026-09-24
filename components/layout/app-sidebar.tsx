'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  BookOpen,
  Bot,
  FolderOpen,
  Hammer,
  LayoutDashboard,
  LogOut,
  Plug,
  Settings,
  type LucideIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { CURRENT_USER, NAV_ITEMS, SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants'
import type { NavItemIcon } from '@/types'
import { getInitials } from '@/utils/format'

const NAV_ICONS: Record<NavItemIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  projects: FolderOpen,
  agents: Bot,
  mcphub: Plug,
  docs: BookOpen,
  settings: Settings,
}

/**
 * Application sidebar (240px, collapsible to icon rail):
 * brand header, main navigation and the user footer with logout.
 */
export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const name = session?.user?.name ?? CURRENT_USER.name
  const email = session?.user?.email ?? CURRENT_USER.email

  return (
    <Sidebar collapsible="icon">
      {/* Brand */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:!p-1.5">
              <Link href="/dashboard">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Hammer className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{SITE_NAME}</span>
                  <span className="truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/60">
                    {SITE_DESCRIPTION}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = NAV_ICONS[item.icon]
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* User */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip={name}>
              <Link href="/settings">
                <Avatar className="size-8 shrink-0 rounded-lg">
                  <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{name}</span>
                  <span className="truncate text-xs text-sidebar-foreground/60">{email}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              variant="outline"
              tooltip="Log out"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              <LogOut />
              <span>Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
