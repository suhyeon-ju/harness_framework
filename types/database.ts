export interface UserRow {
  id: string
  kakao_id: string
  plan: 'free' | 'pro'
  industry: string
  tone: string
  emoji_level: string
  hashtag_enabled: boolean
  created_at: string
}

export interface PostRow {
  id: string
  user_id: string
  content: string
  topic: string
  is_uploaded: boolean
  is_favorited: boolean
  created_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  status: 'active' | 'expired' | 'cancelled'
  started_at: string
  expires_at: string
}
