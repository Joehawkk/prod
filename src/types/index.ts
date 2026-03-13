export interface ProfileResponse {
  user_id: string
  name: string | null
  birthday: string | null
  age: number | null
  gender: 'male' | 'female' | 'other' | null
  avatar: string | null
  description: string | null
  city: string | null
  party_rk: string | null
}

export interface User {
  id: string
  name: string
  age: number
  avatar_url?: string
  bio: string
  city?: string
  gender?: string
  score?: number
  explanation?: string
  match_tags?: string[]
}

export interface MatchResponse {
  match_id: string
  user: {
    user_id: string
    name: string | null
    avatar: string | null
    age: number | null
  }
  last_message: string | null
  unread_count: number
  created_at: string
}

export interface Match {
  id: string
  user: User
  created_at: string
  last_message?: { content: string; created_at: string }
  last_message_at?: string
  unread_count: number
}

export interface MessageResponse {
  id: string
  sender_id: string
  message: string
  message_type: 'text' | 'image' | 'meeting_invite'
  is_read: boolean
  created_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  message_type: string
  created_at: string
}

export interface MeetingResponse {
  id: string
  match_id: string
  created_by: string
  date: string
  time: string
  location: string
  description: string | null
  message_id: string | null
  status: string
  created_at: string
}

export interface FeedUser {
  user_id: string
  name: string | null
  birthday: string | null
  age: number | null
  gender: string | null
  avatar: string | null
  description: string | null
  city: string | null
  party_rk: string | null
  explanation?: string | null
}

export interface GoFeedCandidate {
  user_id: string
  name: string
  birthday: string
  gender: string
  city: string
  avatar: string
  description: string
  similarity_score: number
  match_tags: string[]
}

export interface GoRecommendation {
  user_id: string
  name: string
  age: number
  avatar_url: string
  match_percent: number
  match_tags: string[]
}

export type InteractionType = 'like' | 'dislike' | 'block'
