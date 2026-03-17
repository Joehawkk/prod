import { create } from 'zustand'

const STORAGE_KEY = 'tmatch_dismissed_likes'

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function persist(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

interface DismissedLikesState {
  dismissed: Set<string>
  dismiss: (userId: string) => void
  isDismissed: (userId: string) => boolean
}

export const useDismissedLikesStore = create<DismissedLikesState>((set, get) => ({
  dismissed: loadDismissed(),
  dismiss: (userId: string) => {
    set((state) => {
      const next = new Set(state.dismissed).add(userId)
      persist(next)
      return { dismissed: next }
    })
  },
  isDismissed: (userId: string) => get().dismissed.has(userId),
}))
