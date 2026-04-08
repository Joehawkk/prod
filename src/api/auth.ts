import { api } from './client'

interface AuthResponse {
  user_id: string
  access_token: string
  has_profile: boolean
}

interface CheckResponse {
  exists: boolean
}

export const authApi = {
  check: (phone: string, code: string) =>
    api.post<CheckResponse>('/api/auth/check', { phone, code }),

  register: (phone: string, code: string) =>
    api.post<AuthResponse>('/api/auth/register', { phone, code }),

  login: (phone: string, code: string) =>
    api.post<AuthResponse>('/api/auth/login', { phone, code }),
}
