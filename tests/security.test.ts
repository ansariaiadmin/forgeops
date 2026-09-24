import { describe, expect, it, vi, beforeEach } from 'vitest'

import { encrypt, decrypt, selfTest } from '@/lib/crypto'
import { rateLimit } from '@/lib/rate-limit'

const TEST_KEY = 'a'.repeat(64) // 32 bytes hex — valid for tests

describe('field encryption (AES-256-GCM)', () => {
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = TEST_KEY
  })

  it('round-trips a secret', () => {
    const secret = 'sk_live_51H4x9Ksecret123'
    const encrypted = encrypt(secret)
    expect(encrypted).not.toContain(secret)
    expect(decrypt(encrypted)).toBe(secret)
  })

  it('produces unique ciphertext per call (random IV)', () => {
    const a = encrypt('same value')
    const b = encrypt('same value')
    expect(a).not.toBe(b)
    expect(decrypt(a)).toBe(decrypt(b))
  })

  it('fails on tampered payloads', () => {
    const encrypted = encrypt('precious-data')
    expect(() => decrypt(encrypted.slice(0, -6) + 'deadbe')).toThrow()
  })

  it('selfTest passes', () => {
    expect(selfTest()).toBe(true)
  })
})

describe('rate limiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests up to the limit, then rejects', () => {
    const key = 'test-key-1'
    for (let i = 0; i < 5; i += 1) {
      expect(rateLimit(key, 5, 60_000)).toBe(true)
    }
    expect(rateLimit(key, 5, 60_000)).toBe(false)
  })

  it('resets after the window elapses', () => {
    const key = 'test-key-2'
    expect(rateLimit(key, 2, 60_000)).toBe(true)
    expect(rateLimit(key, 2, 60_000)).toBe(true)
    expect(rateLimit(key, 2, 60_000)).toBe(false)

    vi.advanceTimersByTime(61_000)
    expect(rateLimit(key, 2, 60_000)).toBe(true)
  })

  it('tracks keys independently', () => {
    expect(rateLimit('key-a', 1, 60_000)).toBe(true)
    expect(rateLimit('key-a', 1, 60_000)).toBe(false)
    expect(rateLimit('key-b', 1, 60_000)).toBe(true)
  })
})
