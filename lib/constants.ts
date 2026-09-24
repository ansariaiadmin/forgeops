import type { NavItem, UserProfile } from '@/types'

export const SITE_NAME = 'ForgeOps'
export const SITE_DESCRIPTION = 'DevOps control plane'
export const SITE_VERSION = '0.1.0'

export const NAV_ITEMS: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { title: 'Projects', href: '/projects', icon: 'projects' },
  { title: 'Agents', href: '/agents', icon: 'agents' },
  { title: 'MCP Hub', href: '/mcp-hub', icon: 'mcphub' },
  { title: 'Docs', href: '/docs', icon: 'docs' },
  { title: 'Settings', href: '/settings', icon: 'settings' },
]

export const CURRENT_USER: UserProfile = {
  name: 'Aria Developer',
  email: 'aria@forgeops.dev',
  role: 'Admin',
}
