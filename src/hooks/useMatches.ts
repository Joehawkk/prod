import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchesApi } from '@/api/matches'
import { useUiStore } from '@/store/uiStore'
import type { Match, Message } from '@/types'

export function useMatches() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['matches'],
    queryFn: async (): Promise<Match[]> => {
      const prev = queryClient.getQueryData<Match[]>(['matches'])
      const res = await matchesApi.list()
      return (res.data.matches || []).map((m) => {
        const cached = prev?.find((p) => p.id === m.match_id)
        let lastMsgAt = cached?.last_message_at || undefined
        if (!lastMsgAt && m.last_message) {
          const msgs = queryClient.getQueryData<Message[]>(['messages', m.match_id])
          if (msgs && msgs.length > 0) {
            lastMsgAt = msgs[msgs.length - 1].created_at
          }
        }
        return {
          id: m.match_id,
          user: {
            id: m.user.user_id,
            name: m.user.name || 'Пользователь',
            age: m.user.age || 0,
            avatar_url: m.user.avatar || undefined,
            bio: '',
          },
          created_at: m.created_at,
          last_message: m.last_message
            ? { content: m.last_message, created_at: lastMsgAt || m.created_at }
            : undefined,
          last_message_at: lastMsgAt,
          unread_count: m.unread_count || 0,
        }
      })
    },
    refetchInterval: 30_000,
  })
}

export function useMessages(matchId: string) {
  return useQuery({
    queryKey: ['messages', matchId],
    queryFn: async (): Promise<Message[]> => {
      const res = await matchesApi.getMessages(matchId)
      return (res.data.messages || []).map((m) => ({
        id: m.id,
        match_id: matchId,
        sender_id: m.sender_id,
        content: m.message,
        message_type: m.message_type,
        created_at: m.created_at,
      })).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    },
    enabled: !!matchId,
    refetchInterval: 30_000,
  })
}

export function useSendMessage(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (text: string) => matchesApi.sendMessage(matchId, text),
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ['messages', matchId] })
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', matchId])
      const previousMatches = queryClient.getQueryData<Match[]>(['matches'])

      const now = new Date().toISOString()

      const optimisticMsg: Message = {
        id: `optimistic-${Date.now()}`,
        match_id: matchId,
        sender_id: 'current',
        content: text,
        message_type: 'text',
        created_at: now,
      }
      queryClient.setQueryData<Message[]>(['messages', matchId], (old) =>
        [...(old || []), optimisticMsg]
      )

      queryClient.setQueryData<Match[]>(['matches'], (old) =>
        (old || []).map((m) =>
          m.id === matchId
            ? { ...m, last_message: { content: text, created_at: now }, last_message_at: now }
            : m
        )
      )

      return { previousMessages, previousMatches }
    },
    onError: (_err, _text, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(['messages', matchId], context.previousMessages)
      }
      if (context?.previousMatches) {
        queryClient.setQueryData(['matches'], context.previousMatches)
      }
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось отправить сообщение' })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

export function useSendImage(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => matchesApi.sendImage(matchId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
    onError: () => {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось отправить фото' })
    },
  })
}

export function useMarkRead(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => matchesApi.markRead(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches'] })
    },
  })
}

export function useProposeMeeting(matchId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: { date: string; time: string; location: string; description?: string }) =>
      matchesApi.proposeMeeting(matchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] })
      useUiStore.getState().addToast({ type: 'success', message: 'Встреча предложена!' })
    },
    onError: () => {
      useUiStore.getState().addToast({ type: 'error', message: 'Не удалось предложить встречу' })
    },
  })
}
