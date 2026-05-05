import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import type { UserRow, PostRow } from '@/types/database'
import { PLAN_LIMITS } from '@/types'
import DashboardClient from '@/components/DashboardClient'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

function getKSTWeekInfo() {
  const now = new Date()
  const kstNow = new Date(now.getTime() + KST_OFFSET_MS)

  const year = kstNow.getUTCFullYear()
  const month = kstNow.getUTCMonth()
  const day = kstNow.getUTCDate()
  const dow = kstNow.getUTCDay()

  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const toMonday = dow === 0 ? -6 : 1 - dow
  const mondayDay = day + toMonday

  const weekDates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(year, month, mondayDay + i))
    weekDates.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
    )
  }

  const weekStartUTC = new Date(Date.UTC(year, month, mondayDay, 0, 0, 0) - KST_OFFSET_MS)
  const weekEndUTC = new Date(Date.UTC(year, month, mondayDay + 6, 23, 59, 59, 999) - KST_OFFSET_MS)

  return { weekDates, todayStr, weekStartUTC, weekEndUTC, year, month, day }
}

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (userError || !userRow) redirect('/onboarding')

  const { weekDates, todayStr, weekStartUTC, weekEndUTC, year, month, day } = getKSTWeekInfo()

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', weekStartUTC.toISOString())
    .lte('created_at', weekEndUTC.toISOString())

  const todayStartUTC = new Date(Date.UTC(year, month, day, 0, 0, 0) - KST_OFFSET_MS)
  const todayEndUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - KST_OFFSET_MS)
  const todayPostCount = (posts ?? []).filter((p) => {
    const t = new Date(p.created_at).getTime()
    return t >= todayStartUTC.getTime() && t <= todayEndUTC.getTime()
  }).length

  const dailyLimit = PLAN_LIMITS[(userRow.plan as 'free' | 'pro')].dailyPosts
  const remainingCount = Math.max(0, dailyLimit - todayPostCount)

  return (
    <DashboardClient
      user={userRow as UserRow}
      posts={(posts ?? []) as PostRow[]}
      weekDates={weekDates}
      todayStr={todayStr}
      remainingCount={remainingCount}
    />
  )
}
