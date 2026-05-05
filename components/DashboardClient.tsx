'use client'

import { useState } from 'react'
import type { UserRow, PostRow } from '@/types/database'
import { PLAN_LIMITS } from '@/types'
import WeekTab from './WeekTab'

const INDUSTRY_LABEL: Record<string, string> = {
  cafe: '☕ 카페',
  restaurant: '🍽️ 음식점',
  realestate: '🏠 부동산',
  hairsalon: '✂️ 헤어샵',
}

interface DashboardClientProps {
  user: UserRow
  posts: PostRow[]
  weekDates: string[]
  todayStr: string
  remainingCount: number
}

export default function DashboardClient({
  user,
  posts,
  weekDates,
  todayStr,
  remainingCount,
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const industryLabel = INDUSTRY_LABEL[user.industry] ?? user.industry
  const dailyLimit = PLAN_LIMITS[(user.plan as 'free' | 'pro')].dailyPosts

  return (
    <div className="max-w-md mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">{industryLabel}</h1>
        <span className="text-sm text-gray-500">
          남은 생성 {remainingCount}/{dailyLimit}
        </span>
      </div>

      <WeekTab
        weekDates={weekDates}
        selectedDate={selectedDate}
        todayStr={todayStr}
        posts={posts}
        onSelectDate={setSelectedDate}
      />

      <div className="mt-6" />
    </div>
  )
}
