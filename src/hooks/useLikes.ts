import { useQuery } from '@tanstack/react-query'
import { interactionsApi, type Liker } from '@/api/interactions'
import { useDismissedLikesStore } from '@/store/dismissedLikesStore'

export function useLikes() {
  return useQuery({
    queryKey: ['likes'],
    queryFn: async (): Promise<{ likers: Liker[]; total: number }> => {
      const res = await interactionsApi.getLikes()
      return res.data
    },
    refetchInterval: 30_000,
  })
}

export function useLikesCount() {
  const { data } = useLikes()
  const dismissed = useDismissedLikesStore((s) => s.dismissed)
  if (!data?.likers) return 0
  return data.likers.filter((l) => !dismissed.has(l.user_id)).length
}
