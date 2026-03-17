import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useUiStore } from '@/store/uiStore'

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] })
    vi.useFakeTimers()
  })

  it('starts with no toasts', () => {
    expect(useUiStore.getState().toasts).toHaveLength(0)
  })

  it('addToast adds a toast with id', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Done!' })
    const toasts = useUiStore.getState().toasts
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('Done!')
    expect(toasts[0].type).toBe('success')
    expect(toasts[0].id).toBeTruthy()
  })

  it('removeToast removes by id', () => {
    useUiStore.getState().addToast({ type: 'error', message: 'Err' })
    const id = useUiStore.getState().toasts[0].id
    useUiStore.getState().removeToast(id)
    expect(useUiStore.getState().toasts).toHaveLength(0)
  })

  it('auto-removes toast after 4 seconds', () => {
    useUiStore.getState().addToast({ type: 'info', message: 'Auto' })
    expect(useUiStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(4100)
    expect(useUiStore.getState().toasts).toHaveLength(0)
  })
})
