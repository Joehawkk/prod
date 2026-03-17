import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { FeedUser } from '@/types'
import { api } from '@/api/client'
import { recommendationsApi } from '@/api/recommendations'

vi.mock('@/api/client', () => ({
  api: { get: vi.fn() },
}))

describe('recommendations API (feed)', () => {
  const mockFeedUsers: FeedUser[] = [
    {
      user_id: 'user-1',
      name: 'Алиса',
      birthday: null,
      age: 25,
      gender: 'female',
      avatar: 'https://example.com/1.jpg',
      description: 'Люблю кофе',
      city: 'Москва',
      party_rk: null,
      explanation: 'Похожие интересы и образ жизни',
    },
    {
      user_id: 'user-2',
      name: null,
      birthday: null,
      age: null,
      gender: null,
      avatar: null,
      description: null,
      city: null,
      party_rk: null,
    },
  ]

  beforeEach(() => {
    vi.mocked(api.get).mockReset()
  })

  it('getFeed calls GET /api/recommendations with default limit', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    await recommendationsApi.getFeed()

    expect(api.get).toHaveBeenCalledWith(
      '/api/recommendations',
      expect.objectContaining({ params: { limit: 10 } })
    )
  })

  it('getFeed calls GET /api/recommendations with custom limit', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    await recommendationsApi.getFeed(20)

    expect(api.get).toHaveBeenCalledWith(
      '/api/recommendations',
      expect.objectContaining({ params: { limit: 20 } })
    )
  })

  it('getFeed returns array of FeedUser from response data', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: mockFeedUsers })

    const res = await recommendationsApi.getFeed(10)

    const data = res.data as unknown as FeedUser[]
    expect(data).toHaveLength(2)
    expect(data[0]).toMatchObject({
      user_id: 'user-1',
      name: 'Алиса',
      age: 25,
      city: 'Москва',
      explanation: 'Похожие интересы и образ жизни',
    })
    expect(data[1]).toMatchObject({
      user_id: 'user-2',
      name: null,
      age: null,
    })
  })

  it('getFeed handles empty response', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] })

    const res = await recommendationsApi.getFeed(10)

    expect(res.data).toEqual([])
  })
})
