# Step 1: onboarding-submit

## 읽어야 할 파일

먼저 아래 파일들을 읽고 DB 스키마, 보안 설계, 기존 온보딩 UI를 파악하라:

- `CLAUDE.md` — 아키텍처 규칙 (CRITICAL: plan 컬럼은 서버에서만 업데이트)
- `docs/ADR.md` — ADR-001 Supabase 스키마, ADR-002 플랜 보안 설계
- `types/index.ts` — Industry, Tone, Plan 타입 (Phase 1 생성)
- `types/database.ts` — UserRow 타입 (Phase 1 생성)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `app/onboarding/page.tsx` — Step 0에서 생성한 온보딩 페이지
- `components/OnboardingFlow.tsx` — Step 0에서 생성한 멀티스텝 UI

## 작업

온보딩 완료 시 유저 레코드를 생성하는 API Route와 제출 로직을 구현한다.

### `app/api/onboarding/route.ts`

`POST` Route Handler. 온보딩 데이터를 받아 `users` 테이블에 레코드를 생성한다.

```typescript
// 시그니처 수준 가이드
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. createServerClient로 세션 확인 → 미인증 시 401
  // 2. request.json()으로 { industry, tone } 파싱
  // 3. industry, tone 유효성 검증 (Industry, Tone 타입 값인지 확인)
  // 4. users 테이블에 INSERT
  //    - id: session.user.id
  //    - kakao_id: session.user.user_metadata.provider_id (카카오 고유 ID)
  //    - plan: 'free'
  //    - industry: 검증된 industry 값
  //    - tone: 검증된 tone 값
  //    - emoji_level: 'moderate'
  //    - hashtag_enabled: false
  // 5. 이미 레코드 존재 시 (unique 위반) → 409 반환
  // 6. 성공 시 200 + { ok: true }
}
```

유효성 검증 예시:
```typescript
const VALID_INDUSTRIES: Industry[] = ['cafe', 'restaurant', 'realestate', 'hairsalon', 'custom']
const VALID_TONES: Tone[] = ['casual', 'formal', 'friendly', 'informative', 'empathetic']

if (!VALID_INDUSTRIES.includes(industry)) {
  return NextResponse.json({ error: 'Invalid industry' }, { status: 400 })
}
```

`custom` 업종 처리:
- 클라이언트가 `industry: 'custom'`, `customIndustry: '네일샵'` 형태로 전송
- DB에는 `industry: '네일샵'` (실제 입력값)으로 저장

### `components/OnboardingFlow.tsx` 수정

Step 0에서 TODO로 남긴 "완료" 버튼 onClick을 실제 API 호출로 교체한다.

```typescript
// 추가할 상태
const [loading, setLoading] = useState(false)
const [error, setError] = useState<string | null>(null)
const router = useRouter()

// 완료 핸들러
const handleSubmit = async () => {
  setLoading(true)
  setError(null)
  try {
    const res = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        industry: selectedIndustry === 'custom' ? customIndustry : selectedIndustry,
        tone: selectedTone,
      }),
    })
    if (!res.ok) throw new Error('온보딩 저장 실패')
    router.push('/dashboard')
  } catch (e) {
    setError('저장 중 오류가 발생했어요. 다시 시도해주세요.')
  } finally {
    setLoading(false)
  }
}
```

UI 추가 요구사항:
- 로딩 중: "완료" 버튼 텍스트를 "저장 중..." 으로 변경 + `disabled`
- 에러 발생 시: 버튼 아래에 에러 메시지 표시 (`text-red-500 text-sm`)

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `app/api/onboarding/route.ts`가 Route Handler 형식인가? (`export async function POST`)
   - `createServerClient`(서버용)를 사용하는가?
   - `plan` 값을 클라이언트에서 받지 않고 서버에서 `'free'`로 고정하는가? (CRITICAL 규칙)
   - `industry`, `tone` 유효성 검증이 서버에서 수행되는가?
   - `custom` 업종 입력값이 DB에 실제 텍스트로 저장되는가?
   - `OnboardingFlow`에서 로딩/에러 상태가 처리되는가?
3. 결과에 따라 `phases/4-onboarding/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "app/api/onboarding/route.ts(유저 레코드 INSERT, plan=free 고정, 유효성 검증), OnboardingFlow.tsx(API 호출+로딩/에러 처리+router.push dashboard) 구현 완료. Phase 4 전체 완료."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 클라이언트에서 `plan` 값을 POST body에 포함해 서버로 전달하고 그 값을 DB에 저장 금지. 이유: CLAUDE.md CRITICAL 규칙 — plan 컬럼은 서버에서만 업데이트한다. 항상 서버에서 `'free'`로 고정한다.
- `createBrowserClient`(브라우저용 클라이언트)를 Route Handler에서 사용 금지. 이유: Route Handler는 서버 환경에서 실행되므로 반드시 `createServerClient`를 사용해야 세션 쿠키를 올바르게 읽는다.
- `OnboardingFlow.tsx`에서 Supabase 클라이언트로 `users` 테이블에 직접 INSERT 금지. 이유: CLAUDE.md CRITICAL 규칙 — 모든 DB 쓰기 로직은 API Route에서만 처리한다.
- 에러 발생 시 console.error만 하고 UI에 에러를 표시하지 않는 구현 금지. 이유: 사용자가 실패를 인지하지 못하면 재시도를 할 수 없다.
