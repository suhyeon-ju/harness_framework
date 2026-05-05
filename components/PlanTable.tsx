import { PLAN_LIMITS } from "@/types/index"

const features = [
  {
    label: "글 생성",
    free: `1일 ${PLAN_LIMITS.free.dailyPosts}개`,
    pro: `1일 ${PLAN_LIMITS.pro.dailyPosts}개`,
  },
  {
    label: "주제 설정",
    free: "직접 입력만",
    pro: "자동 생성 + 직접 입력",
  },
  {
    label: "AI 보완 옵션",
    free: "제공 안함",
    pro: `하루 ${PLAN_LIMITS.pro.aiEnhance}회 제한`,
  },
  {
    label: "자동 생성 기간 설정",
    free: "제공 안함",
    pro: "제공",
  },
  {
    label: "보관함 저장",
    free: `${PLAN_LIMITS.free.archiveDays}일만 보관`,
    pro: "무제한",
  },
  {
    label: "해시태그 자동 추가",
    free: "제공 안함",
    pro: "제공",
  },
]

export default function PlanTable() {
  return (
    <section className="w-full">
      <p className="text-sm font-medium text-gray-700 mb-3">플랜 비교</p>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            <th className="text-left py-2 pr-3 text-gray-500 font-normal w-1/2">기능</th>
            <th className="text-center py-2 px-2 text-gray-700 font-medium">무료</th>
            <th className="text-center py-2 pl-2 text-orange-500 font-medium">
              프로<br />
              <span className="text-xs font-normal text-gray-500">월 5,000원</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((row, i) => (
            <tr key={row.label} className={i % 2 === 0 ? "bg-gray-50" : ""}>
              <td className="py-2 pr-3 text-gray-600">{row.label}</td>
              <td className="py-2 px-2 text-center text-gray-500">{row.free}</td>
              <td className="py-2 pl-2 text-center text-gray-800">{row.pro}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
