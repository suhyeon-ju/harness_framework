import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import KakaoLoginButton from "@/components/KakaoLoginButton"
import PlanTable from "@/components/PlanTable"

export default async function Home() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect("/dashboard")

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-6 py-16 flex flex-col gap-14">

        {/* Hero */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="text-orange-500 text-xs font-bold tracking-widest uppercase">doPOST</span>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-gray-900">
              매일 Threads,<br />AI가 대신<br />써드려요
            </h1>
            <p className="text-gray-400 text-base leading-relaxed">
              업종과 말투만 설정하면 끝.<br />
              복사하고 붙여넣기만 하면 됩니다.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { icon: "✍️", label: "AI가 게시글 초안을 대신 써드려요" },
              { icon: "📋", label: "원클릭 복사로 바로 Threads에 올리기" },
              { icon: "🎯", label: "업종 · 말투 · 해시태그 자동 맞춤" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-lg w-7 shrink-0 text-center">{icon}</span>
                <span className="text-sm text-gray-600">{label}</span>
              </div>
            ))}
          </div>

          <KakaoLoginButton />
        </section>

        {/* Divider */}
        <div className="h-px bg-gray-100" />

        {/* Plan */}
        <section className="flex flex-col gap-4">
          <p className="text-xs font-bold tracking-widest uppercase text-gray-400">플랜 비교</p>
          <PlanTable />
        </section>

      </div>
    </main>
  )
}
