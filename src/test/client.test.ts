import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now() - 30_000
  } catch {
    return true
  }
}

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesig`
}

describe('JWT token handling', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('treats corrupted token as expired', () => {
    expect(isTokenExpired('not.a.jwt')).toBe(true)
    expect(isTokenExpired('garbage')).toBe(true)
    expect(isTokenExpired('')).toBe(true)
  })

  it('treats expired token as expired', () => {
    const expiredToken = makeJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) - 3600 })
    expect(isTokenExpired(expiredToken)).toBe(true)
  })

  it('treats valid token as not expired', () => {
    const validToken = makeJwt({ sub: 'user1', exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(isTokenExpired(validToken)).toBe(false)
  })

  it('treats token without exp as not expired', () => {
    const noExpToken = makeJwt({ sub: 'user1' })
    expect(isTokenExpired(noExpToken)).toBe(false)
  })
})
