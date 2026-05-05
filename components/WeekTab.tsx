import type { PostRow } from '@/types/database'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

interface WeekTabProps {
  weekDates: string[]
  selectedDate: string
  todayStr: string
  posts: PostRow[]
  onSelectDate: (date: string) => void
}

function postToKSTDateStr(utcStr: string): string {
  const kst = new Date(new Date(utcStr).getTime() + KST_OFFSET_MS)
  return `${kst.getUTCFullYear()}-${String(kst.getUTCMonth() + 1).padStart(2, '0')}-${String(kst.getUTCDate()).padStart(2, '0')}`
}

export default function WeekTab({
  weekDates,
  selectedDate,
  todayStr,
  posts,
  onSelectDate,
}: WeekTabProps) {
  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDates.map((dateStr) => {
        const date = new Date(dateStr)
        const weekdayName = date.toLocaleDateString('ko-KR', { weekday: 'short' })
        const dayNum = parseInt(dateStr.slice(8, 10), 10)

        const isToday = dateStr === todayStr
        const isSelected = dateStr === selectedDate

        const datePosts = posts.filter((p) => postToKSTDateStr(p.created_at) === dateStr)
        const hasPosts = datePosts.length > 0
        const hasUnuploaded = datePosts.some((p) => !p.is_uploaded)

        return (
          <button
            key={dateStr}
            onClick={() => onSelectDate(dateStr)}
            className={`flex flex-col items-center py-2 ${
              !isToday && isSelected ? 'border-b-2 border-orange-500' : ''
            }`}
          >
            <span className="text-xs text-gray-500 mb-1">{weekdayName}</span>
            <span
              className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full ${
                isToday
                  ? 'bg-orange-500 text-white'
                  : isSelected
                    ? 'text-orange-500'
                    : 'text-gray-700'
              }`}
            >
              {dayNum}
            </span>
            <div className="h-2 flex items-center justify-center mt-1">
              {hasPosts && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasUnuploaded ? 'bg-orange-400' : 'bg-green-500'
                  }`}
                />
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
