import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useRecommendations } from '@/hooks/useRecommendations'
import Discover from '@/pages/Discover'
import type { User } from '@/types'

const mockRefetch = vi.fn()
const mockCreateInteraction = vi.fn()

vi.mock('@/hooks/useRecommendations')

vi.mock('@/api/interactions', () => ({
  interactionsApi: {
    create: (...args: unknown[]) => mockCreateInteraction(...args),
  },
}))

vi.mock('@/api/feed', () => ({
  feedApi: {
    swipe: vi.fn().mockResolvedValue({ data: { is_match: false, message: 'ok' } }),
  },
}))

vi.mock('@/api/reports', () => ({
  reportsApi: {
    create: vi.fn().mockResolvedValue({ data: { message: 'ok' } }),
  },
}))

const feedUsers: User[] = [
  {
    id: 'u1',
    name: 'Алиса',
    age: 25,
    avatar_url: undefined,
    bio: 'Люблю кофе и книги',
    city: 'Москва',
    score: 0.78,
    match_tags: ['Рестораны', 'Кафе', 'Путешествия'],
  },
  {
    id: 'u2',
    name: 'Боб',
    age: 28,
    avatar_url: undefined,
    bio: '',
    city: 'Казань',
  },
]

function renderDiscover() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Discover />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Feed (Discover)', () => {
  beforeEach(() => {
    useAuthStore.getState().setToken('fake-token')
    useAuthStore.getState().setHasProfile(true)
    localStorage.setItem('tmatch_tip_shown', '1')
    mockRefetch.mockClear()
    mockCreateInteraction.mockClear()
    vi.mocked(useRecommendations).mockReturnValue({
      data: feedUsers,
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useRecommendations>)
  })

  it('shows loading skeleton while feed is loading', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useRecommendations>)

    renderDiscover()

    expect(document.querySelector('.skeleton')).toBeInTheDocument()
  })

  it('shows error state with retry button when feed fails', async () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useRecommendations>)

    renderDiscover()

    expect(screen.getByText('Не удалось загрузить ленту')).toBeInTheDocument()
    expect(screen.getByText('Повторить')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Повторить'))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it('shows empty state when no recommendations', () => {
    vi.mocked(useRecommendations).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useRecommendations>)

    renderDiscover()

    expect(screen.getByText('Все просмотрены!')).toBeInTheDocument()
    expect(screen.getByText(/Возвращайся позже/)).toBeInTheDocument()
    expect(screen.getByText('Обновить')).toBeInTheDocument()
  })

  it('renders first user card with name and age', () => {
    renderDiscover()

    expect(screen.getByText(/Алиса/)).toBeInTheDocument()
    expect(screen.getByText(/25/)).toBeInTheDocument()
  })

  it('shows compatibility score on card', () => {
    renderDiscover()

    expect(screen.getAllByText('78%').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('совпадение').length).toBeGreaterThanOrEqual(1)
  })

  it('shows match tags on card', () => {
    renderDiscover()

    expect(screen.getByText('Рестораны · Кафе · Путешествия')).toBeInTheDocument()
  })

  it('renders like button on card', () => {
    renderDiscover()

    const buttons = document.querySelectorAll('button')
    const likeButton = Array.from(buttons).find(
      (btn) => btn.className.includes('blue-500') && btn.className.includes('rounded-full')
    )
    expect(likeButton).toBeTruthy()
  })
})
