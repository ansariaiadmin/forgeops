'use client'

import * as React from 'react'
import { Landmark, Scale, Vault } from 'lucide-react'

import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TreasuryFeed {
  balances: Record<string, number>
  caps: { hot_wallet: number; pool: number }
  balanced: boolean
  tenant: string
}

interface SweepRow {
  key: string
  booking_date: string
  currency: string
  amount: number
  destination: string
}

interface TreasuryPayload {
  treasury: TreasuryFeed
  recentSweeps: SweepRow[]
}

const ACCOUNTS = [
  { code: '1010', label: 'Hot Wallet', icon: Landmark },
  { code: '1020', label: 'Trading Pool', icon: Scale },
  { code: '1030', label: 'Cold Vault', icon: Vault },
] as const

function formatMinor(value: number): string {
  return `${value.toLocaleString('en-US')} minor`
}

/**
 * Treasury cards fed by GET /api/dashboard/treasury.
 * Shows 1010/1020/1030 balances against their caps plus ledger
 * integrity. Skeletons until the feed arrives; an explicit error
 * card when the AURORA API is unreachable (never mock numbers).
 */
export function TreasuryCards() {
  const [data, setData] = React.useState<TreasuryPayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    fetch('/api/dashboard/treasury', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`treasury feed: ${response.status}`))))
      .then((payload: TreasuryPayload) => {
        if (!cancelled) setData(payload)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'treasury feed failed')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-sm">Treasury</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((slot) => (
          <Skeleton key={slot} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  const { balances, caps, balanced } = data.treasury
  const poolUsage = caps.pool > 0 ? Math.min(1, (balances['1020'] ?? 0) / caps.pool) : 0

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {ACCOUNTS.map(({ code, label, icon: Icon }) => (
        <Card key={code}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {label} · {code}
            </CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="font-mono text-lg font-semibold">{formatMinor(balances[code] ?? 0)}</p>
            {code === '1020' && (
              <p className="mt-1 text-xs text-muted-foreground">
                {(poolUsage * 100).toFixed(1)}% of {formatMinor(caps.pool)} pool cap
              </p>
            )}
            {code === '1010' && (
              <p className="mt-1 text-xs text-muted-foreground">cap {formatMinor(caps.hot_wallet)}</p>
            )}
          </CardContent>
        </Card>
      ))}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ledger health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', balanced ? 'bg-emerald-500' : 'bg-red-500')} />
          <Badge variant={balanced ? 'secondary' : 'destructive'} className="font-mono">
            {balanced ? 'balanced' : 'UNBALANCED'}
          </Badge>
          <span className="text-xs text-muted-foreground">{data.recentSweeps.length} recent sweeps</span>
        </CardContent>
      </Card>
    </div>
  )
}
