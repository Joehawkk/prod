import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore, onLogout } from '@/store/authStore'
import { profileApi } from '@/api/profile'
import { isValidAvatar } from '@/utils/avatar'
import { ToastContainer } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { OfflineBanner } from '@/components/OfflineBanner'
import { AppShell } from '@/components/layout/AppShell'
import Landing from '@/pages/Landing'
import Auth from '@/pages/Auth'
import Onboarding from '@/pages/Onboarding'
import Discover from '@/pages/Discover'
import Likes from '@/pages/Likes'
import Matches from '@/pages/Matches'
import Chat from '@/pages/Chat'
import Profile from '@/pages/Profile'
import NotFound from '@/pages/NotFound'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

onLogout(() => {
  queryClient.clear()
  localStorage.removeItem('tmatch_dismissed_likes')
})

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasProfile = useAuthStore((s) => s.hasProfile)

  if (isAuthenticated && hasProfile) {
    return <Navigate to="/discover" replace />
  }

  if (isAuthenticated && !hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasProfile = useAuthStore((s) => s.hasProfile)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    profileApi.get()
      .then((res) => {
        const valid = isValidAvatar(res.data.avatar)
        useAuthStore.getState().setHasProfile(valid)
      })
      .catch((err) => {
        const status = err?.response?.status
        if (status && status >= 400 && status < 500) {
          useAuthStore.getState().setHasProfile(false)
        }
      })
      .finally(() => setChecked(true))
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (!checked) {
    return null
  }

  if (!hasProfile) {
    return <Navigate to="/onboarding" replace />
  }

  return <AppShell />
}

function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hasProfile = useAuthStore((s) => s.hasProfile)

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  if (hasProfile) {
    return <Navigate to="/discover" replace />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route
              path="/onboarding"
              element={
                <OnboardingGuard>
                  <Onboarding />
                </OnboardingGuard>
              }
            />
            <Route element={<ProtectedRoute />}>
              <Route path="/discover" element={<Discover />} />
              <Route path="/likes" element={<Likes />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/matches/:id" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer />
          <OfflineBanner />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
