import { PLAN_LIMITS } from "@/types/index"

const features = [
  {
    label: "글 생성",
    free: `1일 ${PLAN_LIMITS.free.dailyPosts}개`,
    pro: `1일 ${PLAN_LIMITS.pro.dailyPosts}개`,
  },
  {
    label: "주제 설정",
    free: "직접 입력",
    pro: "자동 + 직접 입력",
  },
  {
    label: "AI 보완",
    free: "—",
    pro: `하루 ${PLAN_LIMITS.pro.aiEnhance}회`,
  },
  {
    label: "보관함",
    free: `${PLAN_LIMITS.free.archiveDays}일`,
    pro: "무제한",
  },
  {
    label: "해시태그",
    free: "—",
    pro: "자동 추가",
  },
]

export default function PlanTable() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Free */}
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-gray-700">무료</span>
          <span className="text-2xl font-bold text-gray-900">₩0</span>
          <span className="text-xs text-gray-400">영원히 무료</span>
        </div>
        <div className="h-px bg-gray-200" />
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f.label} className="flex flex-col gap-0.5">
              <span className="text-xs text-gray-400">{f.label}</span>
              <span className="text-sm font-medium text-gray-700">{f.free}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Pro */}
      <div className="flex flex-col gap-4 rounded-2xl border border-orange-100 bg-orange-50 p-5">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-orange-500">프로</span>
          <span className="text-2xl font-bold text-gray-900">₩5,000</span>
          <span className="text-xs text-gray-400">월 구독</span>
        </div>
        <div className="h-px bg-orange-100" />
        <ul className="flex flex-col gap-2.5">
          {features.map((f) => (
            <li key={f.label} className="flex flex-col gap-0.5">
              <span className="text-xs text-orange-400">{f.label}</span>
              <span className="text-sm font-medium text-gray-800">{f.pro}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
