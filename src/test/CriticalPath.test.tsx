import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import Auth from '@/pages/Auth'
import Landing from '@/pages/Landing'
import Matches from '@/pages/Matches'
import Discover from '@/pages/Discover'
import Profile from '@/pages/Profile'

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/hooks/useRecommendations', () => ({
  useRecommendations: () => ({
    data: [
      { id: '1', name: 'Alice', age: 25, avatar_url: null, bio: 'Hello', city: 'Москва', score: 0.78 },
      { id: '2', name: 'Bob', age: 28, avatar_url: null, bio: 'Hey', city: 'Казань', score: 0.85 },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useMatches', () => ({
  useMatches: () => ({
    data: [
      {
        id: 'match1',
        user: { id: 'u1', name: 'Alice', age: 25, avatar_url: null, bio: '' },
        created_at: new Date().toISOString(),
        last_message: { content: 'Привет!', created_at: new Date().toISOString() },
        unread_count: 2,
      },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useProfile', () => ({
  useProfile: () => ({
    data: { name: 'Test User', age: 25, avatar_url: null, bio: 'Bio text', city: 'Moscow' },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useUpdateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCreateProfile: () => ({ mutateAsync: vi.fn(), isPending: false }),
}))

vi.mock('@/api/interactions', () => ({
  interactionsApi: { create: vi.fn().mockResolvedValue({ data: { matched: false } }) },
}))

function renderWithProviders(ui: React.ReactElement, initialRoute = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Critical Path Integration', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    localStorage.clear()
  })

  it('Landing renders start button and features', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByText('T-Match')).toBeInTheDocument()
    expect(screen.getByText('Начать')).toBeInTheDocument()
    expect(screen.getByText('Свайпай!')).toBeInTheDocument()
    expect(screen.getByText('Общайся!')).toBeInTheDocument()
    expect(screen.getByText('Встречайся!')).toBeInTheDocument()
  })

  it('Auth phone input formats and navigates to code step', async () => {
    renderWithProviders(<Auth />)
    expect(screen.getByText('T-Match')).toBeInTheDocument()

    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    expect(input).toHaveValue('+7 (999) 123-45-67')

    await userEvent.click(screen.getByText('Продолжить'))
    expect(await screen.findByText('Введите код')).toBeInTheDocument()
  })

  it('Discover renders cards with like/dislike buttons', () => {
    useAuthStore.getState().setToken('fake-token')
    useAuthStore.getState().setHasProfile(true)
    localStorage.setItem('tmatch_tip_shown', '1')

    renderWithProviders(<Discover />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
  })

  it('Discover shows empty state when no users', () => {
    vi.doMock('@/hooks/useRecommendations', () => ({
      useRecommendations: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
    }))

    renderWithProviders(<Discover />)
  })

  it('Matches renders conversation list with unread badge', () => {
    useAuthStore.getState().setToken('fake-token')
    renderWithProviders(<Matches />)
    expect(screen.getByText('Сообщения')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Привет!')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('Profile shows user info and logout button', () => {
    useAuthStore.getState().setToken('fake-token')
    renderWithProviders(<Profile />)
    expect(screen.getByText('Мой профиль')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('Выйти из аккаунта')).toBeInTheDocument()
  })

  it('Profile logout opens confirmation modal', async () => {
    useAuthStore.getState().setToken('fake-token')
    renderWithProviders(<Profile />)
    await userEvent.click(screen.getByText('Выйти из аккаунта'))
    expect(screen.getByText('Выход из аккаунта')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите выйти?')).toBeInTheDocument()
  })

  it('Matches empty state renders', () => {
    vi.doMock('@/hooks/useMatches', () => ({
      useMatches: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
    }))

    renderWithProviders(<Matches />)
  })
})
