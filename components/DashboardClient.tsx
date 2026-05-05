'use client'

import { useState } from 'react'
import type { UserRow, PostRow } from '@/types/database'
import { PLAN_LIMITS } from '@/types'
import WeekTab from './WeekTab'
import PostCard from './PostCard'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

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

function postToKSTDateStr(utcStr: string): string {
  const kst = new Date(new Date(utcStr).getTime() + KST_OFFSET_MS)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`
}

export default function DashboardClient({
  user,
  posts,
  weekDates,
  todayStr,
  remainingCount,
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [localPosts, setLocalPosts] = useState<PostRow[]>(posts)

  const industryLabel = INDUSTRY_LABEL[user.industry] ?? user.industry
  const dailyLimit = PLAN_LIMITS[(user.plan as 'free' | 'pro')].dailyPosts

  const handleUploaded = (postId: string) => {
    setLocalPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, is_uploaded: true } : p))
    )
  }

  const handleDeleted = (postId: string) => {
    setLocalPosts((prev) => prev.filter((p) => p.id !== postId))
  }

  const selectedPosts = localPosts.filter(
    (p) => postToKSTDateStr(p.created_at) === selectedDate
  )

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
        posts={localPosts}
        onSelectDate={setSelectedDate}
      />

      <div className="mt-6 space-y-3">
        {selectedPosts.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">이 날짜에 작성된 게시글이 없어요.</p>
        ) : (
          selectedPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              isToday={selectedDate === todayStr}
              onUploaded={handleUploaded}
              onDeleted={handleDeleted}
            />
          ))
        )}
      </div>
    </div>
  )
}
