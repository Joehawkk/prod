import { goApi } from './goClient'
import type { GoFeedCandidate, GoRecommendation } from '@/types'

export interface FeedParams {
  want_gender: string
  min_age?: number
  max_age?: number
  limit?: number
}

export const feedApi = {
  getFeed: (params: FeedParams) =>
    goApi.post<{ candidates: GoFeedCandidate[]; total: number }>('/api/v1/feed', params),

  swipe: (target_user_id: string, action: 'like' | 'skip' | 'block' | 'report') =>
    goApi.post<{ is_match: boolean; message: string }>('/api/v1/swipe', { target_user_id, action }),

  getRecommendations: (limit = 20) =>
    goApi.get<{ candidates: GoRecommendation[]; total: number }>('/api/v1/recommendations', { params: { limit } }),
}
