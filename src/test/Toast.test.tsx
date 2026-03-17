import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useUiStore } from '@/store/uiStore'
import { ToastContainer } from '@/components/ui/Toast'

describe('ToastContainer', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] })
  })

  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer />)
    expect(container.querySelectorAll('[class*="rounded-xl"]')).toHaveLength(0)
  })

  it('renders success toast', () => {
    useUiStore.setState({
      toasts: [{ id: '1', type: 'success', message: 'Saved!' }],
    })
    render(<ToastContainer />)
    expect(screen.getByText('Saved!')).toBeInTheDocument()
  })

  it('renders error toast with red bg', () => {
    useUiStore.setState({
      toasts: [{ id: '2', type: 'error', message: 'Failed!' }],
    })
    render(<ToastContainer />)
    const toast = screen.getByText('Failed!').closest('div')
    expect(toast?.className).toContain('bg-accent-red')
  })

  it('renders multiple toasts', () => {
    useUiStore.setState({
      toasts: [
        { id: '1', type: 'success', message: 'First' },
        { id: '2', type: 'error', message: 'Second' },
      ],
    })
    render(<ToastContainer />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  it('removes toast on close click', async () => {
    useUiStore.setState({
      toasts: [{ id: '1', type: 'info', message: 'Dismiss me' }],
    })
    render(<ToastContainer />)
    expect(screen.getByText('Dismiss me')).toBeInTheDocument()

    const closeBtn = screen.getByText('Dismiss me').parentElement?.querySelector('button')
    if (closeBtn) await userEvent.click(closeBtn)

    expect(useUiStore.getState().toasts).toHaveLength(0)
  })
})
