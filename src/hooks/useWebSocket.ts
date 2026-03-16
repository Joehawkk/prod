import { useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import type { Match, Message } from '@/types'

const WS_URL = (import.meta.env.VITE_API_URL || 'http://158.160.19.182:8000')
  .replace(/^http/, 'ws')

const BACKOFF_INITIAL = 1000
const BACKOFF_MAX = 30000
const BACKOFF_MULTIPLIER = 2
const MAX_RECONNECT_ATTEMPTS = 10

type WsEvent =
  | { type: 'new_message'; match_id: string; message: { id: string; sender_id: string; message: string; message_type: string; is_read: boolean; created_at: string } }
  | { type: 'messages_read'; match_id: string; reader_id: string }
  | { type: 'typing'; match_id: string; user_id: string }
  | { type: 'new_match'; match_id: string; user: { user_id: string; name: string; avatar: string; age: number } }
  | { type: 'new_like'; user: { user_id: string; name: string; avatar: string; age: number } }
  | { type: 'match_closed'; match_id: string; closed_by: string }
  | { type: 'pong' }
  | { type: 'error'; detail: string }

type TypingCallback = (matchId: string, userId: string) => void

const typingListeners = new Set<TypingCallback>()

export function onTyping(cb: TypingCallback) {
  typingListeners.add(cb)
  return () => { typingListeners.delete(cb) }
}

let wsInstance: WebSocket | null = null

export function sendWsMessage(matchId: string, text: string) {
  wsInstance?.send(JSON.stringify({ type: 'message', match_id: matchId, text }))
}

export function sendWsTyping(matchId: string) {
  wsInstance?.send(JSON.stringify({ type: 'typing', match_id: matchId }))
}

export function sendWsRead(matchId: string) {
  wsInstance?.send(JSON.stringify({ type: 'read', match_id: matchId }))
}

function getCurrentUserId(): string | null {
  const token = useAuthStore.getState().token
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub || payload.user_id || null
  } catch { return null }
}

export function useWebSocket() {
  const token = useAuthStore((s) => s.token)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const queryClient = useQueryClient()
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pingTimer = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const wsRef = useRef<WebSocket | null>(null)
  const backoffDelay = useRef(BACKOFF_INITIAL)
  const reconnectAttempts = useRef(0)

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return
    if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) return

    const ws = new WebSocket(`${WS_URL}/api/ws?token=${token}`)
    wsRef.current = ws
    wsInstance = ws

    ws.onopen = () => {
      backoffDelay.current = BACKOFF_INITIAL
      reconnectAttempts.current = 0

      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, 25_000)
    }

    ws.onmessage = (ev) => {
      let data: WsEvent
      try { data = JSON.parse(ev.data) } catch { return }

      switch (data.type) {
        case 'new_message': {
          const msg = data.message
          const myId = getCurrentUserId()
          const isOwn = msg.sender_id === myId
          const parsed: Message = {
            id: msg.id,
            match_id: data.match_id,
            sender_id: msg.sender_id,
            content: msg.message,
            message_type: msg.message_type,
            created_at: msg.created_at,
          }
          queryClient.setQueryData<Message[]>(['messages', data.match_id], (old) =>
            old ? [...old.filter((m) => m.id !== parsed.id), parsed] : [parsed]
          )
          queryClient.setQueryData<Match[]>(['matches'], (old) =>
            old?.map((m) =>
              m.id === data.match_id
                ? {
                    ...m,
                    last_message: { content: msg.message, created_at: msg.created_at },
                    last_message_at: msg.created_at,
                    unread_count: isOwn ? m.unread_count : m.unread_count + 1,
                  }
                : m
            )
          )
          queryClient.invalidateQueries({ queryKey: ['matches'] })

          if (!isOwn) {
            const currentPath = window.location.pathname
            const isInThisChat = currentPath === `/matches/${data.match_id}`
            if (!isInThisChat) {
              const matches = queryClient.getQueryData<Match[]>(['matches'])
              const senderMatch = matches?.find((m) => m.id === data.match_id)
              useUiStore.getState().addMessageNotification({
                matchId: data.match_id,
                senderName: senderMatch?.user?.name || 'Новое сообщение',
                senderAvatar: senderMatch?.user?.avatar_url,
                text: msg.message_type === 'image' ? 'Фото' : msg.message,
              })
            }
          }
          break
        }

        case 'messages_read':
          queryClient.invalidateQueries({ queryKey: ['messages', data.match_id] })
          queryClient.invalidateQueries({ queryKey: ['matches'] })
          break

        case 'typing':
          typingListeners.forEach((cb) => cb(data.match_id, data.user_id))
          break

        case 'new_match':
          useUiStore.getState().addToast({
            type: 'success',
            message: `Новый мэтч с ${data.user.name}!`,
          })
          if (navigator.vibrate) navigator.vibrate([50, 30, 80])
          queryClient.invalidateQueries({ queryKey: ['matches'] })
          queryClient.invalidateQueries({ queryKey: ['likes'] })
          break

        case 'new_like':
          useUiStore.getState().addToast({
            type: 'success',
            message: `${data.user.name} проявил(а) симпатию!`,
          })
          if (navigator.vibrate) navigator.vibrate(30)
          queryClient.invalidateQueries({ queryKey: ['likes'] })
          break

        case 'match_closed':
          queryClient.invalidateQueries({ queryKey: ['matches'] })
          break

        case 'pong':
        case 'error':
          break
      }
    }

    ws.onclose = (ev) => {
      wsInstance = null
      clearInterval(pingTimer.current)

      if (ev.code === 4001) {
        useAuthStore.getState().logout()
        return
      }

      reconnectAttempts.current += 1
      const delay = backoffDelay.current
      backoffDelay.current = Math.min(backoffDelay.current * BACKOFF_MULTIPLIER, BACKOFF_MAX)

      if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectTimer.current = setTimeout(connect, delay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [token, isAuthenticated, queryClient])

  useEffect(() => {
    backoffDelay.current = BACKOFF_INITIAL
    reconnectAttempts.current = 0
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      clearInterval(pingTimer.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
        wsInstance = null
      }
    }
  }, [connect])
}
