"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"

interface KakaoLoginButtonProps {
  className?: string
}

export default function KakaoLoginButton({ className }: KakaoLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      className={`w-full py-4 px-5 bg-[#FEE500] hover:bg-[#F5DC00] active:bg-[#EDD400] text-[#3C1E1E] rounded-2xl flex items-center justify-center gap-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${className ?? ""}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 3C6.48 3 2 6.48 2 11c0 2.76 1.5 5.2 3.8 6.72l-.96 3.56 3.72-2.46C9.46 19 10.71 19 12 19c5.52 0 10-3.48 10-8S17.52 3 12 3z" />
      </svg>
      {loading ? "연결 중…" : "카카오로 시작하기"}
    </button>
  )
}
