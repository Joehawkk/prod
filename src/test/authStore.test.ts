import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/authStore'

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.hasProfile).toBe(false)
  })

  it('setToken authenticates user', () => {
    useAuthStore.getState().setToken('test-jwt-token')
    const state = useAuthStore.getState()
    expect(state.token).toBe('test-jwt-token')
    expect(state.isAuthenticated).toBe(true)
  })

  it('setHasProfile updates profile flag', () => {
    useAuthStore.getState().setHasProfile(true)
    expect(useAuthStore.getState().hasProfile).toBe(true)
  })

  it('logout clears everything', () => {
    useAuthStore.getState().setToken('token')
    useAuthStore.getState().setHasProfile(true)
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.token).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.hasProfile).toBe(false)
  })
})
