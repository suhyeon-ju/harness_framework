# Step 2: kakao-oauth

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 인증 구조와 UI 컴포넌트를 파악하라:

- `CLAUDE.md` — 아키텍처 규칙 (CRITICAL: 클라이언트 컴포넌트에서 직접 외부 API 호출 금지), 라우팅 분기
- `lib/supabase.ts` — 브라우저용 Supabase 클라이언트 (Phase 1 생성)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `components/KakaoLoginButton.tsx` — Phase 2에서 생성한 버튼 (onClick placeholder 상태)
- `app/page.tsx` — 현재 랜딩 페이지 (서버 컴포넌트)
- `app/auth/callback/route.ts` — Step 0에서 생성한 콜백 핸들러
- `middleware.ts` — Step 1에서 생성한 미들웨어

## 작업

세 가지를 구현한다: useAuth 훅, KakaoLoginButton 실제 OAuth 연동, 랜딩 페이지 로그인 리디렉트.

### `hooks/useAuth.ts`

클라이언트 컴포넌트에서 사용할 인증 훅.

```typescript
// 시그니처 수준 가이드
import { User } from '@supabase/supabase-js'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn { ... }
```

구현 요구사항:
- `createClient()`(브라우저용)로 Supabase 클라이언트 생성
- `supabase.auth.getUser()`로 초기 유저 상태 로드
- `supabase.auth.onAuthStateChange`로 상태 변경 구독 (컴포넌트 언마운트 시 구독 해제)
- `signOut`: `supabase.auth.signOut()` 호출 후 `window.location.href = '/'`로 이동

### `components/KakaoLoginButton.tsx` 수정

Phase 2에서 구현한 버튼의 `onClick` placeholder를 실제 Kakao OAuth 호출로 교체한다.

```typescript
// 교체할 핸들러
const handleLogin = async () => {
  const supabase = createClient()  // 브라우저용
  await supabase.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

- `"use client"` 유지 (이미 클라이언트 컴포넌트)
- `loading` 상태 추가: 버튼 클릭 후 OAuth 창이 열리기까지 버튼 비활성화
- 기존 버튼 UI(색상, 아이콘, 레이아웃)는 변경하지 않는다

### `app/page.tsx` 수정

서버 컴포넌트에서 로그인 상태를 확인하여 이미 로그인된 사용자를 리디렉트한다.

```typescript
// 페이지 최상단에 추가할 로직
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')
  // ... 기존 Hero + PlanTable 렌더링
}
```

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `hooks/useAuth.ts`가 `hooks/` 폴더에 있는가?
   - `KakaoLoginButton`이 `createClient()`(브라우저용)를 사용하는가? (`createServerClient` 아님)
   - `app/page.tsx`에서 서버 사이드 리디렉트(`redirect()`)를 사용하는가?
   - `onAuthStateChange` 구독이 `useEffect` cleanup에서 해제되는가?
   - CLAUDE.md CRITICAL 규칙 — 클라이언트 컴포넌트에서 Supabase Auth API 호출만 하는가? (외부 API 직접 호출 없음)
3. 결과에 따라 `phases/3-kakao-auth/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "hooks/useAuth.ts(user/loading/signOut), KakaoLoginButton(실제 Kakao OAuth+loading 상태), app/page.tsx(서버사이드 로그인 체크+redirect) 구현 완료. Phase 3 전체 완료."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 (Supabase 대시보드 Kakao OAuth 미설정, .env.local 미입력 등) → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `KakaoLoginButton`에서 `createServerClient`(서버용) 사용 금지. 이유: 클라이언트 컴포넌트는 브라우저에서 실행되므로 반드시 `createClient()`(브라우저용)를 사용해야 한다.
- `hooks/useAuth.ts`에서 `supabase.auth.signInWithOAuth` 호출 금지. 이유: OAuth 시작은 버튼 컴포넌트의 책임이다. 훅은 세션 상태 관리와 로그아웃만 담당한다.
- `app/page.tsx`에서 클라이언트 사이드 리디렉트(`useRouter().push`) 사용 금지. 이유: 서버 컴포넌트에서 `redirect()`를 사용하면 서버 사이드에서 처리되어 깜빡임이 없고 SEO에도 유리하다.
- `KakaoLoginButton`의 기존 UI(색상, 아이콘, 레이아웃) 변경 금지. 이유: Phase 2에서 완성한 디자인을 유지해야 한다. 이 step은 기능 연동만 담당한다.
