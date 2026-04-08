import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('renders with label', () => {
    render(<Input label="Email" placeholder="Enter email" />)
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(<Input error="Required field" />)
    expect(screen.getByText('Required field')).toBeInTheDocument()
  })

  it('shows hint when no error', () => {
    render(<Input hint="Optional" />)
    expect(screen.getByText('Optional')).toBeInTheDocument()
  })

  it('hides hint when error is present', () => {
    render(<Input error="Error!" hint="Hint text" />)
    expect(screen.getByText('Error!')).toBeInTheDocument()
    expect(screen.queryByText('Hint text')).not.toBeInTheDocument()
  })

  it('handles user input', async () => {
    const onChange = vi.fn()
    render(<Input onChange={onChange} />)
    await userEvent.type(screen.getByRole('textbox'), 'hello')
    expect(onChange).toHaveBeenCalledTimes(5)
  })

  it('renders icon', () => {
    render(<Input icon={<span data-testid="icon">X</span>} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})
