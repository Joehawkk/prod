import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://158.160.19.182:8000',
  timeout: 10_000,
})

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return false
    const payload = JSON.parse(atob(parts[1]))
    if (!payload.exp) return false
    return payload.exp * 1000 < Date.now() - 30_000
  } catch {
    return false
  }
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    if (isTokenExpired(token)) {
      useAuthStore.getState().logout()
      return Promise.reject(new axios.Cancel('Token expired'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const url = error.config?.url || ''
    const isAuthRoute = url.includes('/api/auth/')
    if (error.response?.status === 401 && !isAuthRoute) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
