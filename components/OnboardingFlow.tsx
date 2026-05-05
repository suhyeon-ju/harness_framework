"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Industry, Tone } from "@/types"

const INDUSTRY_OPTIONS: { value: Industry; label: string }[] = [
  { value: "cafe", label: "☕ 카페" },
  { value: "restaurant", label: "🍽️ 음식점" },
  { value: "realestate", label: "🏠 부동산" },
  { value: "hairsalon", label: "✂️ 헤어샵" },
  { value: "custom", label: "✏️ 직접 입력" },
]

const TONE_OPTIONS: { value: Tone; label: string; description: string }[] = [
  { value: "casual", label: "반말체", description: "친한 친구에게 말하듯" },
  { value: "formal", label: "존댓말체", description: "정중하고 격식 있게" },
  { value: "friendly", label: "친근한 말투", description: "동네 단골손님처럼 편안하게" },
  { value: "informative", label: "정보 전달형", description: "핵심 정보만 간결하게" },
  { value: "empathetic", label: "공감 유도형", description: "공감과 질문을 유도하는 방식으로" },
]

export default function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null)
  const [customIndustry, setCustomIndustry] = useState("")
  const [selectedTone, setSelectedTone] = useState<Tone | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const isNextEnabled = selectedIndustry !== null && (selectedIndustry !== "custom" || customIndustry.trim() !== "")
  const isCompleteEnabled = selectedTone !== null

  const handleSubmit = async () => {
    if (!selectedIndustry || !selectedTone) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry: selectedIndustry === 'custom' ? customIndustry.trim() : selectedIndustry,
          tone: selectedTone,
        }),
      })
      if (!res.ok) throw new Error('온보딩 저장 실패')
      router.push('/dashboard')
    } catch {
      setError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* 진행 표시 */}
      <div className="mb-8">
        <p className="text-xs text-gray-500 mb-2 text-right">{step}/2</p>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className="bg-orange-500 rounded-full h-1 transition-all duration-200"
            style={{ width: step === 1 ? "50%" : "100%" }}
          />
        </div>
      </div>

      {step === 1 && (
        <>
          <h1 className="text-xl font-bold text-gray-900 mb-6">어떤 업종이세요?</h1>
          <div className="space-y-3">
            {INDUSTRY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedIndustry(option.value)}
                className={`w-full rounded-lg border p-4 cursor-pointer transition-colors text-left text-sm font-medium ${
                  selectedIndustry === option.value
                    ? "border-orange-500 bg-orange-50 text-gray-900"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {option.label}
              </button>
            ))}
            {selectedIndustry === "custom" && (
              <input
                type="text"
                value={customIndustry}
                onChange={(e) => setCustomIndustry(e.target.value)}
                placeholder="업종명을 입력하세요"
                className="rounded-lg bg-white border border-gray-300 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none w-full mt-2"
              />
            )}
          </div>
          <button
            onClick={() => setStep(2)}
            disabled={!isNextEnabled}
            className={`mt-8 rounded-lg bg-orange-500 text-white py-3 w-full font-medium transition-colors ${
              isNextEnabled ? "hover:bg-orange-600" : "opacity-50 cursor-not-allowed"
            }`}
          >
            다음
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h1 className="text-xl font-bold text-gray-900 mb-6">어떤 말투로 쓸까요?</h1>
          <div className="space-y-3">
            {TONE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedTone(option.value)}
                className={`w-full rounded-lg border p-4 cursor-pointer transition-colors text-left ${
                  selectedTone === option.value
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-200 bg-white hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-medium text-gray-900">{option.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
              </button>
            ))}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isCompleteEnabled || loading}
            className={`mt-8 rounded-lg bg-orange-500 text-white py-3 w-full font-medium transition-colors ${
              isCompleteEnabled && !loading ? "hover:bg-orange-600" : "opacity-50 cursor-not-allowed"
            }`}
          >
            {loading ? "저장 중..." : "완료"}
          </button>
          {error && <p className="mt-2 text-red-500 text-sm text-center">{error}</p>}
          <button
            onClick={() => setStep(1)}
            className="mt-3 w-full py-2 text-gray-500 text-sm"
          >
            뒤로
          </button>
        </>
      )}
    </div>
  )
}
