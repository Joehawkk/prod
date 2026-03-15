import { api } from './client'

export const reportsApi = {
  create: (target_user_id: string, reason: string, comment?: string) =>
    api.post<{ message: string }>('/api/reports', { target_user_id, reason, comment }),
}
