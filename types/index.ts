/** Discriminated icon keys used by the sidebar navigation. */
export type NavItemIcon = 'dashboard' | 'projects' | 'agents' | 'mcphub' | 'docs' | 'settings'

/** A single entry in the main sidebar navigation. */
export interface NavItem {
  title: string
  href: string
  icon: NavItemIcon
}

/** Authenticated user profile shown in the header and sidebar. */
export interface UserProfile {
  name: string
  email: string
  role: string
}

/** Supported theme modes for the app. */
export type Theme = 'light' | 'dark' | 'system'

/** Lifecycle status shared by data-fetching hooks/services. */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error'

/** Generic envelope for API responses used by services in `lib/`. */
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: LoadingStatus
}
