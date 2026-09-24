import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/dashboard/treasury/route'
import { getSessionUser } from '@/lib/auth'

vi.mock('@/lib/auth', () => ({
  getSessionUser: vi.fn(),
}))

const sessionUser = { id: 'u1', role: 'ADMIN' }

function jsonResponse(payload: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => payload } as Response
}

describe('GET /api/dashboard/treasury', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('rejects unauthenticated callers with 401', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null)
    const response = await GET()
    expect(response.status).toBe(401)
  })

  it('combines balances and sweeps from the AURORA API', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser as never)
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        balances: { '1010': 10_000_000, '1020': 50_000_000, '1030': 10_000_000 },
        caps: { hot_wallet: 10_000_000, pool: 50_000_000 },
        balanced: true,
      }))
      .mockResolvedValueOnce(jsonResponse({ sweeps: [{ key: 'k1' }] }))
    vi.stubGlobal('fetch', fetchMock)

    const response = await GET()
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.treasury.balances['1030']).toBe(10_000_000)
    expect(body.recentSweeps).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('surfaces an unreachable AURORA API as 502, never mock data', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(sessionUser as never)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('down')))
    const response = await GET()
    expect(response.status).toBe(502)
    const body = await response.json()
    expect(body.error).toMatch(/unreachable/)
    vi.unstubAllGlobals()
  })
})
