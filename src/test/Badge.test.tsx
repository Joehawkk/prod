import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from '@/components/ui/Badge'

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>New</Badge>)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('applies default variant', () => {
    render(<Badge>Default</Badge>)
    expect(screen.getByText('Default').className).toContain('bg-neutral-100')
  })

  it('applies brand variant', () => {
    render(<Badge variant="brand">Brand</Badge>)
    expect(screen.getByText('Brand').className).toContain('bg-brand-50')
  })

  it('applies count variant', () => {
    render(<Badge variant="count">5</Badge>)
    const el = screen.getByText('5')
    expect(el.className).toContain('bg-brand-500')
    expect(el.className).toContain('rounded-full')
  })

  it('applies custom className', () => {
    render(<Badge className="mt-2">Custom</Badge>)
    expect(screen.getByText('Custom').className).toContain('mt-2')
  })
})
