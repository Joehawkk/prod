import { api } from './client'
import type { ProfileResponse } from '@/types'

export interface CreateProfileData {
  name: string
  birthday: string
  gender: 'male' | 'female'
  avatar?: string
  description?: string
  city?: string
}

export interface UpdateProfileData {
  name?: string
  birthday?: string
  gender?: 'male' | 'female'
  avatar?: string
  description?: string
  city?: string
}

export const profileApi = {
  get: () => api.get<ProfileResponse>('/api/profile'),
  create: (data: CreateProfileData) => api.post<ProfileResponse>('/api/profile', data),
  update: (data: UpdateProfileData) => api.put<ProfileResponse>('/api/profile', data),
  delete: () => api.delete('/api/profile'),
  uploadAvatar: (file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post<{ url: string }>('/api/profile/avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
