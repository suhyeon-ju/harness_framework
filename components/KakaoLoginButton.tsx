"use client"

interface KakaoLoginButtonProps {
  className?: string
}

export default function KakaoLoginButton({ className }: KakaoLoginButtonProps) {
  const handleLogin = () => {
    // TODO: Phase 3 — Kakao OAuth 연동
  }

  return (
    <button
      onClick={handleLogin}
      className={`w-full py-3 px-4 bg-[#FEE500] text-[#3C1E1E] rounded-lg flex items-center justify-center gap-2 font-medium ${className ?? ""}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M12 3C6.48 3 2 6.48 2 11c0 2.76 1.5 5.2 3.8 6.72l-.96 3.56 3.72-2.46C9.46 19 10.71 19 12 19c5.52 0 10-3.48 10-8S17.52 3 12 3z"/>
      </svg>
      카카오로 시작하기
    </button>
  )
}
