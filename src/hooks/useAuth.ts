import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { authApi } from '@/api/auth'
import { api } from '@/api/client'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { isValidAvatar } from '@/utils/avatar'
import type { ProfileResponse } from '@/types'

export function useLogin() {
  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      const checkRes = await authApi.check(phone, code)
      let authRes

      if (checkRes.data.exists) {
        try {
          authRes = await authApi.login(phone, code)
        } catch (e) {
          const axiosErr = e as AxiosError<{ detail?: string }>
          if (axiosErr.response?.status === 404) {
            authRes = await authApi.register(phone, code)
          } else {
            throw e
          }
        }
      } else {
        authRes = await authApi.register(phone, code)
      }

      const token = authRes.data.access_token

      let hasAvatar = false
      try {
        const profile = await api.get<ProfileResponse>('/api/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        hasAvatar = isValidAvatar(profile.data.avatar)
      } catch {
        hasAvatar = false
      }

      useAuthStore.getState().loginWith(token, hasAvatar)
      return authRes
    },
    onError: (err) => {
      const axiosErr = err as AxiosError<{ error?: { message?: string }; detail?: string }>
      const status = axiosErr.response?.status
      const serverMsg = axiosErr.response?.data?.error?.message || axiosErr.response?.data?.detail
      let msg = serverMsg || 'Неверный код или номер телефона'
      if (status === 403) msg = 'Доступно только для клиентов Т-Банка'
      else if (status === 429) msg = 'Слишком много попыток, подождите'
      else if (status === 422) msg = 'Некорректный номер телефона'
      useUiStore.getState().addToast({ type: 'error', message: msg })
    },
  })
}
