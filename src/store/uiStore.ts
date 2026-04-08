import { create } from 'zustand'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

interface MessageNotification {
  id: string
  matchId: string
  senderName: string
  senderAvatar?: string
  text: string
  createdAt: number
}

interface UiState {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void

  messageNotifications: MessageNotification[]
  addMessageNotification: (n: Omit<MessageNotification, 'id' | 'createdAt'>) => void
  dismissMessageNotification: (id: string) => void
  clearNotificationsForMatch: (matchId: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  messageNotifications: [],
  addMessageNotification: (n) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({
      messageNotifications: [
        ...s.messageNotifications.filter((x) => x.matchId !== n.matchId),
        { ...n, id, createdAt: Date.now() },
      ],
    }))
  },
  dismissMessageNotification: (id) =>
    set((s) => ({ messageNotifications: s.messageNotifications.filter((x) => x.id !== id) })),
  clearNotificationsForMatch: (matchId) =>
    set((s) => ({ messageNotifications: s.messageNotifications.filter((x) => x.matchId !== matchId) })),
}))
