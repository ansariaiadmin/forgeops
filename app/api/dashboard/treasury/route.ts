import { NextResponse } from 'next/server'

import { getSessionUser } from '@/lib/auth'

const AURORA_API_URL =
  process.env.AURORA_API_URL ?? 'http://127.0.0.1:8000'

/**
 * GET /api/dashboard/treasury — AURORA treasury feed for the panel.
 * Proxies the AURORA API (treasury balances + recent sweeps) so the
 * dashboard shows hot-wallet 1010, pool 1020, vault 1030, both caps,
 * and ledger integrity. Upstream failures surface as 502 — never
 * silent mock numbers.
 */
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let balances: Response
  let sweeps: Response
  try {
    ;[balances, sweeps] = await Promise.all([
      fetch(`${AURORA_API_URL}/society/treasury/balances`, { cache: 'no-store' }),
      fetch(`${AURORA_API_URL}/society/treasury/sweeps?limit=5`, { cache: 'no-store' }),
    ])
  } catch {
    return NextResponse.json(
      { error: `AURORA API unreachable at ${AURORA_API_URL}` },
      { status: 502 },
    )
  }

  if (!balances.ok) {
    return NextResponse.json(
      { error: `AURORA treasury feed failed: ${balances.status}` },
      { status: 502 },
    )
  }

  return NextResponse.json({
    treasury: await balances.json(),
    recentSweeps: sweeps.ok ? ((await sweeps.json()).sweeps ?? []) : [],
  })
}
