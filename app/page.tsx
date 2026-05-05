import KakaoLoginButton from "@/components/KakaoLoginButton"

export default function Home() {
  return (
    <main>
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="space-y-4">
          <p className="text-2xl font-bold">doPOST</p>
          <p className="text-lg font-medium">매일 뭐 올릴지 고민하지 말고, 그냥 포스팅 해</p>
          <p className="text-sm text-gray-500">자영업자를 위한 Threads 자동 글쓰기 툴</p>
          <KakaoLoginButton />
          {/* TODO: Step 1 — PlanTable 삽입 자리 */}
        </div>
      </div>
    </main>
  )
}
