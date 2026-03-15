import { api } from './client'

export interface RecommendationCandidate {
  user_id: string
  name: string | null
  age: number | null
  gender: string | null
  birthday: string | null
  city: string | null
  avatar: string | null
  description: string | null
  match_percent: number
  match_tags: string[]
}

export interface RecommendationsResponse {
  candidates: RecommendationCandidate[]
  total: number
}

export const recommendationsApi = {
  getFeed: (limit = 10) =>
    api.get<RecommendationsResponse>('/api/recommendations', { params: { limit } }),
}
