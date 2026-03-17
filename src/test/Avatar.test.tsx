import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from '@/components/ui/Avatar'

describe('Avatar', () => {
  it('shows initials when no src', () => {
    render(<Avatar name="John Doe" />)
    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('shows single initial for single name', () => {
    render(<Avatar name="Alice" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders image when src provided', () => {
    render(<Avatar name="John" src="https://example.com/photo.jpg" />)
    const img = screen.getByAltText('John')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg')
  })

  it('applies size classes', () => {
    const { container } = render(<Avatar name="Test" size="xl" />)
    expect(container.firstChild).toHaveClass('w-24', 'h-24')
  })
})
