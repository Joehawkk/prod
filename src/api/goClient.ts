import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const goApi = axios.create({
  baseURL: import.meta.env.VITE_GO_API_URL || 'http://158.160.19.182:8089',
  timeout: 10_000,
})

goApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

goApi.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    return Promise.reject(error)
  }
)
