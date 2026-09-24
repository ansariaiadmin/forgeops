import Link from 'next/link'
import { Hammer } from 'lucide-react'

import { SITE_DESCRIPTION, SITE_NAME } from '@/lib/constants'

/**
 * Centered layout for the authentication pages (/auth/*).
 * No app shell — just the brand and a card.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/40 p-4">
      <Link href="/auth/login" className="flex flex-col items-center gap-2">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
          <Hammer className="size-6" />
        </div>
        <div className="flex flex-col items-center leading-tight">
          <span className="text-lg font-semibold tracking-tight">{SITE_NAME}</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {SITE_DESCRIPTION}
          </span>
        </div>
      </Link>

      <div className="w-full max-w-md">{children}</div>

      <p className="text-xs text-muted-foreground">
        © {new Date().getFullYear()} {SITE_NAME}
      </p>
    </div>
  )
}
