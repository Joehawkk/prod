import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NotFound from '@/pages/NotFound'

describe('NotFound page', () => {
  it('renders 404 text', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
  })

  it('shows page not found message', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    )
    expect(screen.getByText('Страница не найдена')).toBeInTheDocument()
  })

  it('has link to home', () => {
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    )
    expect(screen.getByText('На главную')).toBeInTheDocument()
  })
})
