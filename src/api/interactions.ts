import { api } from './client'
import type { InteractionType } from '@/types'

export interface Liker {
  user_id: string
  name: string | null
  avatar: string | null
  age: number | null
  city: string | null
  liked_at: string
}

export const interactionsApi = {
  create: (target_user_id: string, action: InteractionType) =>
    api.post<{ matched: boolean; match_id: string | null; message: string | null; match_closed: boolean | null }>(
      '/api/interactions',
      { target_user_id, action }
    ),
  getLikes: () =>
    api.get<{ likers: Liker[]; total: number }>('/api/interactions/likes'),
}
