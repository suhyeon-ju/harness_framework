export type Plan = 'free' | 'pro'

export type Industry = 'cafe' | 'restaurant' | 'realestate' | 'hairsalon' | 'custom'

export type Tone = 'casual' | 'formal' | 'friendly' | 'informative' | 'empathetic'

export type EmojiLevel = 'heavy' | 'moderate' | 'none'

export const PLAN_LIMITS = {
  free: { dailyPosts: 1, archiveDays: 7, aiEnhance: 0 },
  pro: { dailyPosts: 3, archiveDays: Infinity, aiEnhance: 10 },
} as const
