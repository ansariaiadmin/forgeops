'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronDown, RefreshCw } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CURRENT_USER } from '@/lib/constants'
import { getInitials } from '@/utils/format'

const NOTIFICATION_COUNT = 3

const NOTIFICATIONS = [
  { title: 'Deploy succeeded', detail: 'api-gateway → production', time: '2m ago' },
  { title: 'Agent finished', detail: 'Builder completed "fix bug #42"', time: '18m ago' },
  { title: 'New comment', detail: 'Aria commented on RAG pipeline', time: '1h ago' },
]

/**
 * Top bar (64px): sidebar trigger + right-side actions —
 * refresh, theme toggle, notifications (with count) and the user menu.
 */
export function AppHeader() {
  const router = useRouter()
  const { data: session } = useSession()
  const [refreshing, setRefreshing] = React.useState(false)

  const name = session?.user?.name ?? CURRENT_USER.name
  const email = session?.user?.email ?? CURRENT_USER.email

  function handleRefresh() {
    setRefreshing(true)
    router.refresh()
    window.setTimeout(() => setRefreshing(false), 700)
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
      <span className="text-sm font-semibold tracking-tight md:hidden">ForgeOps</span>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Refresh */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          aria-label="Refresh"
          title="Refresh"
          className={refreshing ? 'pointer-events-none' : ''}
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} />
        </Button>

        {/* Theme */}
        <ThemeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-4" />
              {NOTIFICATION_COUNT > 0 && (
                <Badge className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px] tabular-nums">
                  {NOTIFICATION_COUNT}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>
              Notifications
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                ({NOTIFICATION_COUNT})
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {NOTIFICATIONS.map((notification) => (
                <DropdownMenuItem
                  key={notification.title}
                  className="flex cursor-pointer flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.detail}</span>
                  <span className="text-[10px] text-muted-foreground/70">{notification.time}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center text-sm font-medium">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight sm:block">
                <span className="block text-sm font-medium">{name}</span>
                <span className="block text-xs text-muted-foreground">{email}</span>
              </span>
              <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col leading-tight">
                <span>{name}</span>
                <span className="text-xs font-normal text-muted-foreground">{email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
                <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
            >
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
