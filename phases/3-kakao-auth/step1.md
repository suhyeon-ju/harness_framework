# Step 1: auth-middleware

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 라우팅 구조와 Supabase 클라이언트 설정을 파악하라:

- `CLAUDE.md` — 페이지 구조 (라우팅 분기: 비로그인/로그인/플랜별), 아키텍처 규칙
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `app/auth/callback/route.ts` — Step 0에서 생성한 콜백 핸들러

## 작업

Next.js 미들웨어를 구현하여 Supabase 세션을 자동으로 갱신하고 보호 라우트에 접근 제어를 적용한다.

### `middleware.ts` (프로젝트 루트에 생성)

```typescript
// 시그니처 수준 가이드
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest): Promise<NextResponse> { ... }

export const config = {
  matcher: [...],
}
```

#### 세션 갱신

`@supabase/ssr`의 `createServerClient`를 사용하여 요청/응답 쿠키를 통해 세션을 갱신한다.
미들웨어에서의 Supabase 클라이언트 생성은 `lib/supabase-server.ts`와 달리 `request`와 `response` 양쪽 쿠키를 모두 처리해야 한다:

```typescript
// 미들웨어에서 클라이언트 생성 패턴 (lib/supabase-server.ts와 다름)
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  }
)
await supabase.auth.getUser()  // 세션 갱신 트리거
```

#### 라우트 보호

보호 라우트 목록:
- `/dashboard` (및 하위 경로)
- `/generate` (및 하위 경로)
- `/history` (및 하위 경로)
- `/settings` (및 하위 경로)
- `/onboarding` (및 하위 경로)

비로그인 상태에서 보호 라우트 접근 시 → `/`로 리디렉트.
로그인 상태에서 `/` 접근 시 → 리디렉트 하지 않는다 (랜딩 페이지에서 자체 처리).

#### `config.matcher`

정적 파일과 Next.js 내부 경로는 미들웨어에서 제외한다:
```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
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
   - `middleware.ts`가 프로젝트 루트에 있는가? (`app/` 내부가 아님)
   - `matcher`에 정적 파일 경로가 제외됐는가?
   - 보호 라우트 5개(`/dashboard`, `/generate`, `/history`, `/settings`, `/onboarding`)가 모두 처리됐는가?
   - 세션 갱신 시 `response` 쿠키에도 세션이 반영되는가?
3. 결과에 따라 `phases/3-kakao-auth/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "middleware.ts 생성 완료: Supabase 세션 갱신, /dashboard·/generate·/history·/settings·/onboarding 보호 라우트 설정, 비로그인 시 / 리디렉트"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `middleware.ts`를 `app/` 디렉토리 안에 생성 금지. 이유: Next.js 미들웨어는 반드시 프로젝트 루트(또는 `src/`)에 위치해야 동작한다.
- 미들웨어에서 DB 쿼리 실행 금지. 이유: 미들웨어는 모든 요청마다 실행되므로 DB 쿼리를 수행하면 성능에 심각한 영향을 준다. 세션 확인은 `getUser()`로만 한다.
- 미들웨어에서 `request` 쿠키만 수정하고 `response` 쿠키를 업데이트하지 않는 구현 금지. 이유: Supabase SSR은 갱신된 세션 토큰을 response 쿠키에 기록해야 다음 요청에서도 세션이 유지된다.
