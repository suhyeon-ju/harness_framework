import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const supabase = await createServerClient()

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(new URL('/?error=auth_failed', request.url))
  }

  const { session } = data

  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', session.user.id)
    .single()

  const isNewUser = !existingUser

  if (isNewUser) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  return NextResponse.redirect(new URL('/dashboard', request.url))
}
