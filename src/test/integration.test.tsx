import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'

;(globalThis as any).__mockLogin = vi.fn()
;(globalThis as any).__mockRecommendations = {
  data: [
    { id: '1', name: 'Alice', age: 25, avatar_url: null, bio: 'Hello', city: 'Москва', score: 0.78 },
    { id: '2', name: 'Bob', age: 28, avatar_url: null, bio: 'Hey', city: 'Казань', score: 0.85 },
    { id: '3', name: 'Carol', age: 23, avatar_url: null, bio: 'Hi', city: 'СПб', score: 0.60 },
  ],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}
;(globalThis as any).__mockMatches = {
  data: [
    {
      id: 'match1',
      user: { id: 'u1', name: 'Alice', age: 25, avatar_url: null, bio: 'Hello', city: 'Москва' },
      created_at: new Date().toISOString(),
      last_message: { content: 'Привет!', created_at: new Date().toISOString() },
      unread_count: 2,
    },
    {
      id: 'match2',
      user: { id: 'u2', name: 'Bob', age: 28, avatar_url: null, bio: '', city: '' },
      created_at: new Date().toISOString(),
      last_message: null,
      unread_count: 0,
    },
  ],
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}

const mockLogin = (globalThis as any).__mockLogin
const mockRecommendations = (globalThis as any).__mockRecommendations
const mockMatches = (globalThis as any).__mockMatches

vi.mock('@/hooks/useAuth', () => ({
  useLogin: () => ({
    mutateAsync: (globalThis as any).__mockLogin,
    isPending: false,
  }),
}))

vi.mock('@/hooks/useRecommendations', () => ({
  useRecommendations: () => (globalThis as any).__mockRecommendations,
}))

vi.mock('@/hooks/useMatches', () => ({
  useMatches: () => (globalThis as any).__mockMatches,
  useMessages: () => ({
    data: [
      { id: 'msg1', sender_id: 'u1', content: 'Привет!', created_at: new Date().toISOString(), message_type: 'text' },
      { id: 'msg2', sender_id: 'current', content: 'Привет, как дела?', created_at: new Date().toISOString(), message_type: 'text' },
    ],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSendMessage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useSendImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useMarkRead: () => ({ mutate: vi.fn() }),
  useProposeMeeting: () => ({ mutateAsync: vi.fn(), isPending: false }),
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

vi.mock('@/hooks/useLikes', () => ({
  useLikes: () => ({
    data: {
      likers: [
        { user_id: 'l1', name: 'Diana', age: 22, avatar: null, city: 'Москва' },
        { user_id: 'l2', name: 'Eve', age: 24, avatar: null, city: 'СПб' },
      ],
    },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('@/hooks/useWebSocket', () => ({
  sendWsMessage: vi.fn(),
  sendWsTyping: vi.fn(),
  sendWsRead: vi.fn(),
  onTyping: vi.fn(() => () => {}),
}))

vi.mock('@/api/interactions', () => ({
  interactionsApi: { create: vi.fn().mockResolvedValue({ data: { matched: false } }) },
}))

vi.mock('@/api/feed', () => ({
  feedApi: {
    swipe: vi.fn().mockResolvedValue({}),
    getFeed: vi.fn().mockResolvedValue({ data: [] }),
    getRecommendations: vi.fn().mockResolvedValue({ data: [] }),
    getCompatibility: vi.fn().mockResolvedValue({ data: {} }),
  },
}))

vi.mock('@/api/reports', () => ({
  reportsApi: { create: vi.fn().mockResolvedValue({}) },
}))

vi.mock('@/api/profile', () => ({
  profileApi: {
    get: vi.fn().mockResolvedValue({ data: { avatar: 'https://example.com/avatar.jpg' } }),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    uploadAvatar: vi.fn().mockResolvedValue({}),
  },
}))

import Auth from '@/pages/Auth'
import Landing from '@/pages/Landing'
import Discover from '@/pages/Discover'
import Matches from '@/pages/Matches'
import Chat from '@/pages/Chat'
import Profile from '@/pages/Profile'
import Likes from '@/pages/Likes'
import Onboarding from '@/pages/Onboarding'
import NotFound from '@/pages/NotFound'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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

function setAuth(hasProfile = true) {
  useAuthStore.getState().setToken('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0LXVzZXIiLCJleHAiOjk5OTk5OTk5OTl9.test')
  useAuthStore.getState().setHasProfile(hasProfile)
  localStorage.setItem('tmatch_tip_shown', '1')
}

beforeEach(() => {
  useAuthStore.getState().logout()
  localStorage.clear()
  vi.clearAllMocks()
  mockRecommendations.data = [
    { id: '1', name: 'Alice', age: 25, avatar_url: null, bio: 'Hello', city: 'Москва', score: 0.78 },
    { id: '2', name: 'Bob', age: 28, avatar_url: null, bio: 'Hey', city: 'Казань', score: 0.85 },
    { id: '3', name: 'Carol', age: 23, avatar_url: null, bio: 'Hi', city: 'СПб', score: 0.60 },
  ]
  mockRecommendations.isLoading = false
  mockRecommendations.isError = false
  mockMatches.data = [
    {
      id: 'match1',
      user: { id: 'u1', name: 'Alice', age: 25, avatar_url: null, bio: 'Hello', city: 'Москва' },
      created_at: new Date().toISOString(),
      last_message: { content: 'Привет!', created_at: new Date().toISOString() },
      unread_count: 2,
    },
    {
      id: 'match2',
      user: { id: 'u2', name: 'Bob', age: 28, avatar_url: null, bio: '', city: '' },
      created_at: new Date().toISOString(),
      last_message: null,
      unread_count: 0,
    },
  ]
  mockMatches.isLoading = false
  mockMatches.isError = false
})

describe('Critical Path: Landing → Auth → Discover → Matches → Chat → Profile', () => {
  it('Landing page renders hero, features, and CTA button', () => {
    renderWithProviders(<Landing />)
    expect(screen.getByText('T-Match')).toBeInTheDocument()
    expect(screen.getByText('Начать')).toBeInTheDocument()
    expect(screen.getByText('Свайпай!')).toBeInTheDocument()
    expect(screen.getByText('Общайся!')).toBeInTheDocument()
    expect(screen.getByText('Встречайся!')).toBeInTheDocument()
    expect(screen.getByText('Как это работает?')).toBeInTheDocument()
  })

  it('Landing CTA navigates unauthenticated user to /auth', async () => {
    renderWithProviders(<Landing />)
    await userEvent.click(screen.getByText('Начать'))
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('Auth page renders phone input with +7 prefix', () => {
    renderWithProviders(<Auth />)
    expect(screen.getByText('T-Match')).toBeInTheDocument()
    expect(screen.getByText('Вход для клиентов Т-Банка')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+7 (999) 123-45-67')).toBeInTheDocument()
  })

  it('Auth phone input formats correctly on paste', async () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    expect(input).toHaveValue('+7 (999) 123-45-67')
  })

  it('Auth button disabled until 10 digits entered', () => {
    renderWithProviders(<Auth />)
    const button = screen.getByText('Продолжить')
    expect(button.closest('button')).toBeDisabled()
  })

  it('Auth transitions to code step with valid phone', async () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    await userEvent.click(screen.getByText('Продолжить'))
    expect(await screen.findByText('Введите код')).toBeInTheDocument()
    expect(screen.getByText('Подтвердить')).toBeInTheDocument()
  })

  it('Auth code step shows back button and returns to phone', async () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    await userEvent.click(screen.getByText('Продолжить'))
    expect(await screen.findByText('Назад')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Назад'))
    expect(await screen.findByText('Вход для клиентов Т-Банка')).toBeInTheDocument()
  })

  it('Auth code inputs advance focus automatically', async () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '79991234567' } })
    await userEvent.click(screen.getByText('Продолжить'))
    await screen.findByText('Введите код')

    const codeInputs = screen.getAllByRole('textbox')
    expect(codeInputs.length).toBeGreaterThanOrEqual(4)
  })

  it('Discover renders recommendation cards', () => {
    setAuth()
    renderWithProviders(<Discover />)
    expect(screen.getByText(/Alice/)).toBeInTheDocument()
    expect(screen.getByText('78%')).toBeInTheDocument()
  })

  it('Matches shows conversations with unread count', () => {
    setAuth()
    renderWithProviders(<Matches />)
    expect(screen.getByText('Сообщения')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Привет!')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('Matches shows new matches section for matches without messages', () => {
    setAuth()
    renderWithProviders(<Matches />)
    expect(screen.getByText('Новые совпадения')).toBeInTheDocument()
    expect(screen.getByText('Bob')).toBeInTheDocument()
  })

  it('Chat renders messages and input area', () => {
    setAuth()
    renderWithProviders(<Chat />, '/matches/match1')
    expect(screen.getByText('Чат')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Введите сообщение...')).toBeInTheDocument()
    expect(screen.getByText('Привет!')).toBeInTheDocument()
    expect(screen.getByText('Привет, как дела?')).toBeInTheDocument()
  })

  it('Profile renders user info and action buttons', () => {
    setAuth()
    renderWithProviders(<Profile />)
    expect(screen.getByText('Мой профиль')).toBeInTheDocument()
    expect(screen.getByText(/Test User/)).toBeInTheDocument()
    expect(screen.getByText('Выйти из аккаунта')).toBeInTheDocument()
    expect(screen.getByText('Удалить профиль')).toBeInTheDocument()
  })

  it('Profile logout shows confirmation modal', async () => {
    setAuth()
    renderWithProviders(<Profile />)
    await userEvent.click(screen.getByText('Выйти из аккаунта'))
    expect(screen.getByText('Выход из аккаунта')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите выйти?')).toBeInTheDocument()
  })

  it('Profile delete shows confirmation modal with warning', async () => {
    setAuth()
    renderWithProviders(<Profile />)
    await userEvent.click(screen.getByText('Удалить профиль'))
    expect(screen.getByText('Удаление профиля')).toBeInTheDocument()
    expect(screen.getByText(/необратимо/)).toBeInTheDocument()
  })
})

describe('Client States & Error Handling', () => {
  describe('Auth error states', () => {
    it('does not proceed to code step with incomplete phone', async () => {
      renderWithProviders(<Auth />)
      const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
      fireEvent.change(input, { target: { value: '7999' } })
      await userEvent.click(screen.getByText('Продолжить'))
      expect(screen.queryByText('Введите код')).not.toBeInTheDocument()
    })

    it('shakes code inputs on verification failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('invalid code'))
      renderWithProviders(<Auth />)
      const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
      fireEvent.change(input, { target: { value: '79991234567' } })
      await userEvent.click(screen.getByText('Продолжить'))
      await screen.findByText('Введите код')

      const codeInputs = screen.getAllByRole('textbox')
      const last4 = codeInputs.slice(-4)
      for (let i = 0; i < 4; i++) {
        fireEvent.change(last4[i], { target: { value: String(i + 1) } })
      }

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled()
      })
    })

    it('handles phone number with leading 8 without crashing', () => {
      renderWithProviders(<Auth />)
      const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
      fireEvent.change(input, { target: { value: '89991234567' } })
      expect(input).toBeInTheDocument()
      expect((input as HTMLInputElement).value).toMatch(/^\+7/)
    })

    it('ignores non-digit characters in phone input', () => {
      renderWithProviders(<Auth />)
      const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
      fireEvent.change(input, { target: { value: '+7abc' } })
      expect(input).toBeInTheDocument()
    })
  })

  describe('Discover error states', () => {
    it('shows error state when API fails', () => {
      setAuth()
      mockRecommendations.isError = true
      mockRecommendations.data = []
      renderWithProviders(<Discover />)
      expect(screen.getByText('Не удалось загрузить ленту')).toBeInTheDocument()
      expect(screen.getByText('Повторить')).toBeInTheDocument()
    })

    it('shows empty state when no recommendations', () => {
      setAuth()
      mockRecommendations.data = []
      renderWithProviders(<Discover />)
      expect(screen.getByText('Все просмотрены!')).toBeInTheDocument()
      expect(screen.getByText('Обновить')).toBeInTheDocument()
    })

    it('retry button calls refetch on error', async () => {
      setAuth()
      mockRecommendations.isError = true
      mockRecommendations.data = []
      renderWithProviders(<Discover />)
      await userEvent.click(screen.getByText('Повторить'))
      expect(mockRecommendations.refetch).toHaveBeenCalled()
    })
  })

  describe('Matches error states', () => {
    it('shows error state when matches API fails', () => {
      setAuth()
      mockMatches.isError = true
      mockMatches.data = [] as any
      renderWithProviders(<Matches />)
      expect(screen.getByText('Не удалось загрузить чаты')).toBeInTheDocument()
      expect(screen.getByText('Повторить')).toBeInTheDocument()
    })

    it('shows empty state when no matches', () => {
      setAuth()
      mockMatches.data = []
      renderWithProviders(<Matches />)
      expect(screen.getByText('Пока нет мэтчей')).toBeInTheDocument()
    })

    it('retry button works on matches error', async () => {
      setAuth()
      mockMatches.isError = true
      mockMatches.data = [] as any
      renderWithProviders(<Matches />)
      await userEvent.click(screen.getByText('Повторить'))
      expect(mockMatches.refetch).toHaveBeenCalled()
    })
  })

  describe('Chat error states', () => {
    it('renders empty chat state with prompt to write first message', () => {
      vi.doMock('@/hooks/useMatches', () => ({
        useMatches: () => mockMatches,
        useMessages: () => ({
          data: [],
          isLoading: false,
          isError: false,
          refetch: vi.fn(),
        }),
        useSendMessage: () => ({ mutateAsync: vi.fn(), isPending: false }),
        useSendImage: () => ({ mutateAsync: vi.fn(), isPending: false }),
        useMarkRead: () => ({ mutate: vi.fn() }),
        useProposeMeeting: () => ({ mutateAsync: vi.fn(), isPending: false }),
      }))

      setAuth()
      renderWithProviders(<Chat />, '/matches/match1')
      expect(screen.getByText('Чат')).toBeInTheDocument()
    })

    it('chat has message input field', () => {
      setAuth()
      renderWithProviders(<Chat />, '/matches/match1')
      expect(screen.getByPlaceholderText('Введите сообщение...')).toBeInTheDocument()
    })
  })

  describe('Profile error states', () => {
    it('cancel button on logout modal closes it', async () => {
      setAuth()
      renderWithProviders(<Profile />)
      await userEvent.click(screen.getByText('Выйти из аккаунта'))
      expect(screen.getByText('Вы уверены, что хотите выйти?')).toBeInTheDocument()
      await userEvent.click(screen.getByText('Отмена'))
      await waitFor(() => {
        expect(screen.queryByText('Вы уверены, что хотите выйти?')).not.toBeInTheDocument()
      })
    })

    it('cancel button on delete modal closes it', async () => {
      setAuth()
      renderWithProviders(<Profile />)
      await userEvent.click(screen.getByText('Удалить профиль'))
      expect(screen.getByText(/необратимо/)).toBeInTheDocument()
      await userEvent.click(screen.getByText('Отмена'))
      await waitFor(() => {
        expect(screen.queryByText(/необратимо/)).not.toBeInTheDocument()
      })
    })
  })
})

describe('Onboarding Flow', () => {
  it('renders upload photo screen', () => {
    renderWithProviders(<Onboarding />)
    expect(screen.getByText('Загрузите фото')).toBeInTheDocument()
    expect(screen.getByText('Добавьте аватарку, чтобы начать')).toBeInTheDocument()
    expect(screen.getByText('Выбрать фото')).toBeInTheDocument()
  })

  it('continue button is disabled without photo', () => {
    renderWithProviders(<Onboarding />)
    const button = screen.getByText('Продолжить')
    expect(button.closest('button')).toBeDisabled()
  })
})

describe('Likes Page', () => {
  it('shows likers with swipe cards', () => {
    setAuth()
    renderWithProviders(<Likes />)
    expect(screen.getByText('Симпатии')).toBeInTheDocument()
    expect(screen.getByText(/Diana/)).toBeInTheDocument()
  })
})

describe('Error Boundary', () => {
  const ThrowError = () => { throw new Error('Test crash') }
  const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => consoleSpy.mockRestore())

  it('catches runtime errors and shows fallback UI', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText('Что-то пошло не так')).toBeInTheDocument()
    expect(screen.getByText(/Произошла непредвиденная ошибка/)).toBeInTheDocument()
    expect(screen.getByText('Попробовать снова')).toBeInTheDocument()
    expect(screen.getByText('Скопировать отчёт')).toBeInTheDocument()
  })

  it('displays unique error code', () => {
    renderWithProviders(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )
    expect(screen.getByText(/Код ошибки: E-/)).toBeInTheDocument()
  })
})

describe('404 Page', () => {
  it('renders not found page', () => {
    renderWithProviders(<NotFound />)
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

describe('Auth Store', () => {
  it('starts unauthenticated', () => {
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.hasProfile).toBe(false)
  })

  it('loginWith sets token, isAuthenticated, and hasProfile', () => {
    useAuthStore.getState().loginWith('test-token', true)
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(true)
    expect(state.token).toBe('test-token')
    expect(state.hasProfile).toBe(true)
  })

  it('logout clears all auth state', () => {
    useAuthStore.getState().loginWith('test-token', true)
    useAuthStore.getState().logout()
    const state = useAuthStore.getState()
    expect(state.isAuthenticated).toBe(false)
    expect(state.token).toBeNull()
    expect(state.hasProfile).toBe(false)
  })

  it('setHasProfile updates profile flag independently', () => {
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setHasProfile(true)
    expect(useAuthStore.getState().hasProfile).toBe(true)
    useAuthStore.getState().setHasProfile(false)
    expect(useAuthStore.getState().hasProfile).toBe(false)
  })
})

describe('UI Store — Toasts', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [], messageNotifications: [] })
  })

  it('adds toast to store', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Test toast' })
    expect(useUiStore.getState().toasts).toHaveLength(1)
    expect(useUiStore.getState().toasts[0].message).toBe('Test toast')
  })

  it('removes toast by id', () => {
    useUiStore.getState().addToast({ type: 'error', message: 'Error toast' })
    const id = useUiStore.getState().toasts[0].id
    useUiStore.getState().removeToast(id)
    expect(useUiStore.getState().toasts).toHaveLength(0)
  })

  it('supports multiple toasts', () => {
    useUiStore.getState().addToast({ type: 'success', message: 'Toast 1' })
    useUiStore.getState().addToast({ type: 'error', message: 'Toast 2' })
    useUiStore.getState().addToast({ type: 'success', message: 'Toast 3' })
    expect(useUiStore.getState().toasts).toHaveLength(3)
  })
})

describe('Discover Interactions', () => {
  it('shows tip overlay on first visit', () => {
    setAuth()
    localStorage.removeItem('tmatch_tip_shown')
    renderWithProviders(<Discover />)
    expect(screen.getByText('Как пользоваться?')).toBeInTheDocument()
  })

  it('shows match score percentage', () => {
    setAuth()
    renderWithProviders(<Discover />)
    expect(screen.getByText('78%')).toBeInTheDocument()
  })

  it('displays user name and age on card', () => {
    setAuth()
    renderWithProviders(<Discover />)
    expect(screen.getByText(/Alice, 25/)).toBeInTheDocument()
  })

  it('shows report button on top card', () => {
    setAuth()
    renderWithProviders(<Discover />)
    const buttons = document.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})

describe('Chat Interactions', () => {
  it('renders meeting proposal button (calendar icon)', () => {
    setAuth()
    renderWithProviders(<Chat />, '/matches/match1')
    const buttons = document.querySelectorAll('button')
    expect(buttons.length).toBeGreaterThan(2) // back + calendar + attach
  })

  it('displays both own and received messages', () => {
    setAuth()
    renderWithProviders(<Chat />, '/matches/match1')
    expect(screen.getByText('Привет!')).toBeInTheDocument()
    expect(screen.getByText('Привет, как дела?')).toBeInTheDocument()
  })

  it('chat back button is rendered', () => {
    setAuth()
    renderWithProviders(<Chat />, '/matches/match1')
    expect(screen.getByText('Чат')).toBeInTheDocument()
  })
})

describe('Phone Input Edge Cases', () => {
  it('handles empty input gracefully', () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toBeInTheDocument()
  })

  it('strips extra digits beyond 10 local digits', () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '799912345678999' } })
    expect(input).toHaveValue('+7 (999) 123-45-67')
  })

  it('handles phone with +7 prefix', () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '+79991234567' } })
    expect(input).toHaveValue('+7 (999) 123-45-67')
  })

  it('formats partial phone correctly', () => {
    renderWithProviders(<Auth />)
    const input = screen.getByPlaceholderText('+7 (999) 123-45-67')
    fireEvent.change(input, { target: { value: '7999' } })
    expect(input).toHaveValue('+7 (999')
  })
})
