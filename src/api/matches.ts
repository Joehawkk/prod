import { api } from './client'
import type { MatchResponse, MessageResponse, MeetingResponse } from '@/types'

export const matchesApi = {
  list: () => api.get<{ matches: MatchResponse[] }>('/api/matches'),
  getMessages: (matchId: string) =>
    api.get<{ messages: MessageResponse[] }>(`/api/matches/${matchId}/messages`),
  sendMessage: (matchId: string, text: string, message_type: string = 'text') =>
    api.post<MessageResponse>(`/api/matches/${matchId}/messages`, { text, message_type }),
  markRead: (matchId: string) =>
    api.put<{ success: boolean; updated_count: number }>(`/api/matches/${matchId}/messages/read`),
  sendImage: (matchId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<MessageResponse>(`/api/matches/${matchId}/messages/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  proposeMeeting: (matchId: string, data: { date: string; time: string; location: string; description?: string }) =>
    api.post<MeetingResponse>(`/api/matches/${matchId}/meetings`, data),
  deleteMatch: (matchId: string) =>
    api.delete<{ message: string }>(`/api/matches/${matchId}`),
}
