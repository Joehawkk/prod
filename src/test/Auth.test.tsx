import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Auth from '@/pages/Auth'

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutateAsync: vi.fn(),
    isPending: false,
  }),
}))

function renderAuth() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Auth />
      </BrowserRouter>
    </QueryClientProvider>
  )
}

describe('Auth page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form', () => {
    renderAuth()
    expect(screen.getByText('T-Match')).toBeInTheDocument()
    expect(screen.getByText('Вход для клиентов Т-Банка')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+7 (999) 123-45-67')).toBeInTheDocument()
  })

  it('has no registration link', () => {
    renderAuth()
    expect(screen.queryByText('Регистрация')).not.toBeInTheDocument()
  })

  it('formats phone number as user types', () => {
    renderAuth()
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    expect(input).toHaveValue('+7 (999) 123-45-67')
  })

  it('does not submit with incomplete phone', async () => {
    renderAuth()
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '799' } })
    await userEvent.click(screen.getByText('Продолжить'))
    expect(screen.queryByText('Введите код')).not.toBeInTheDocument()
  })

  it('navigates to code step with valid phone', async () => {
    renderAuth()
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    await userEvent.click(screen.getByText('Продолжить'))
    expect(await screen.findByText('Введите код')).toBeInTheDocument()
    expect(screen.getByText('Подтвердить')).toBeInTheDocument()
  })

  it('navigates to code step on Enter with valid phone', async () => {
    renderAuth()
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', charCode: 13 })
    await waitFor(() => {
      expect(screen.getAllByRole('textbox')).toHaveLength(4)
    })
  })
  it('shows back button on code step', async () => {
    renderAuth()
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    await userEvent.click(screen.getByText('Продолжить'))
    expect(await screen.findByText('Назад')).toBeInTheDocument()
  })
})
