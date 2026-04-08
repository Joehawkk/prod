import { useQuery, useQueryClient } from '@tanstack/react-query'
import { recommendationsApi } from '@/api/recommendations'
import { feedApi } from '@/api/feed'
import type { User } from '@/types'

function calcAge(birthday: string): number {
  const birth = new Date(birthday)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function useRecommendations() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['recommendations'],
    queryFn: async (): Promise<User[]> => {
      try {
        const res = await recommendationsApi.getFeed(20)
        const candidates = res.data?.candidates
        if (candidates?.length) {
          return candidates.map((c) => ({
            id: c.user_id,
            name: c.name || 'Пользователь',
            age: c.age ?? (c.birthday ? calcAge(c.birthday) : 0),
            avatar_url: c.avatar || undefined,
            bio: c.description || '',
            city: c.city || undefined,
            gender: c.gender || undefined,
            score: c.match_percent != null ? c.match_percent / 100 : undefined,
            match_tags: c.match_tags || [],
          }))
        }
      } catch {}

      const profile = queryClient.getQueryData<User | null>(['profile'])
      const wantGender = profile?.gender === 'male' ? 'female' : 'male'

      try {
        const res = await feedApi.getRecommendations(20)
        if (res.data?.candidates?.length) {
          return res.data.candidates.map((c) => ({
            id: c.user_id,
            name: c.name || 'Пользователь',
            age: c.age || 0,
            avatar_url: c.avatar_url || undefined,
            bio: '',
            score: c.match_percent ? c.match_percent / 100 : undefined,
            match_tags: c.match_tags || [],
          }))
        }
      } catch {}

      try {
        const res = await feedApi.getFeed({
          want_gender: wantGender,
          min_age: 18,
          max_age: 99,
          limit: 20,
        })
        if (res.data?.candidates?.length) {
          return res.data.candidates.map((c) => ({
            id: c.user_id,
            name: c.name || 'Пользователь',
            age: c.birthday ? calcAge(c.birthday) : 0,
            avatar_url: c.avatar || undefined,
            bio: c.description || '',
            city: c.city || undefined,
            gender: c.gender || undefined,
            score: c.similarity_score ? c.similarity_score / 100 : undefined,
            match_tags: c.match_tags || [],
          }))
        }
      } catch {}

      return []
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })
}
