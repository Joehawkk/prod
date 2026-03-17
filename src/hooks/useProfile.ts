import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { profileApi, type CreateProfileData, type UpdateProfileData } from '@/api/profile'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { isValidAvatar } from '@/utils/avatar'
import type { User, ProfileResponse } from '@/types'

function profileToUser(p: ProfileResponse): User {
  return {
    id: p.user_id,
    name: p.name || 'Пользователь',
    age: p.age || 0,
    avatar_url: p.avatar || undefined,
    bio: p.description || '',
    city: p.city || undefined,
    gender: p.gender || undefined,
  }
}

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      try {
        const res = await profileApi.get()
        const hasAvatar = isValidAvatar(res.data.avatar)
        useAuthStore.getState().setHasProfile(hasAvatar)
        return profileToUser(res.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          useAuthStore.getState().setHasProfile(false)
          return null
        }
        throw err
      }
    },
    enabled: isAuthenticated,
    retry: false,
  })
}

export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProfileData) => profileApi.create(data),
    onSuccess: () => {
      useAuthStore.getState().setHasProfile(true)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось создать профиль' })
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateProfileData) => profileApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      useUiStore.getState().addToast({ type: 'success', message: 'Профиль обновлён' })
    },
    onError: () => {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось обновить профиль' })
    },
  })
}
