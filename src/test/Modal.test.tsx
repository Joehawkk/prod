import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={() => {}}>Content</Modal>)
    expect(screen.queryByText('Content')).not.toBeInTheDocument()
  })

  it('renders children when open', () => {
    render(<Modal open={true} onClose={() => {}}>Modal Content</Modal>)
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<Modal open={true} onClose={() => {}} title="Test Title">Body</Modal>)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Title">Body</Modal>)
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[0])
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('calls onClose when Escape pressed', async () => {
    const onClose = vi.fn()
    render(<Modal open={true} onClose={onClose} title="Title">Body</Modal>)
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('locks body scroll when open', () => {
    const { unmount } = render(<Modal open={true} onClose={() => {}}>Body</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
