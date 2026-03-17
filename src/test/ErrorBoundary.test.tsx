import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from '@/components/ErrorBoundary'

function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test crash')
  return <div>Working fine</div>
}

describe('ErrorBoundary', () => {
  const originalError = console.error
  beforeEach(() => {
    console.error = vi.fn()
  })
  afterEach(() => {
    console.error = originalError
  })

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Working fine')).toBeInTheDocument()
  })

  it('shows fallback on error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('shows both recovery buttons that are enabled', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )
    const retryBtn = screen.getByText('Попробовать снова')
    const reloadBtn = screen.getByText('Обновить')
    expect(retryBtn).toBeEnabled()
    expect(reloadBtn).toBeEnabled()
  })
})
