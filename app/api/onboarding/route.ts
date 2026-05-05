import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { Industry, Tone } from '@/types'

const VALID_INDUSTRIES: Industry[] = ['cafe', 'restaurant', 'realestate', 'hairsalon', 'custom']
const VALID_TONES: Tone[] = ['casual', 'formal', 'friendly', 'informative', 'empathetic']

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { industry, tone } = body as { industry?: string; tone?: string }

  if (!industry || !tone) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // 'custom' 리터럴은 클라이언트에서 실제 텍스트로 변환해 전송해야 함
  if (industry === 'custom') {
    return NextResponse.json({ error: 'Invalid industry: send actual text instead of "custom"' }, { status: 400 })
  }

  if (!VALID_TONES.includes(tone as Tone)) {
    return NextResponse.json({ error: 'Invalid tone' }, { status: 400 })
  }

  const { error } = await supabase.from('users').insert({
    id: user.id,
    kakao_id: (user.user_metadata?.provider_id as string) ?? '',
    plan: 'free',
    industry,
    tone,
    emoji_level: 'moderate',
    hashtag_enabled: false,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already onboarded' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
