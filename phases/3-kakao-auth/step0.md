# Step 0: auth-callback

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 인증 구조와 기존 Supabase 클라이언트 설정을 파악하라:

- `CLAUDE.md` — 아키텍처 규칙 (CRITICAL: 모든 API 로직은 app/api/ 또는 Route Handler에서만 처리)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `types/database.ts` — UserRow 타입 (Phase 1 생성)

## 작업

Kakao OAuth 인증 완료 후 Supabase가 리디렉트하는 콜백 Route Handler를 구현한다.

### `app/auth/callback/route.ts`

`GET` Route Handler. Supabase OAuth 플로우가 완료되면 이 URL로 리디렉트된다.

```typescript
// 시그니처 수준 가이드
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest): Promise<NextResponse> { ... }
```

처리 로직:
1. `request.nextUrl.searchParams`에서 `code` 추출
2. `code`가 없으면 `/`로 리디렉트 (에러 처리)
3. `createServerClient`(서버용)로 Supabase 클라이언트 생성
4. `supabase.auth.exchangeCodeForSession(code)` 호출
5. 에러 발생 시 `/?error=auth_failed`로 리디렉트
6. 성공 시 신규/기존 유저 분기:
   - 신규 유저 감지 기준: `users` 테이블에 해당 `id`로 레코드가 없는 경우
   - 신규 유저 → `/onboarding`으로 리디렉트
   - 기존 유저 → `/dashboard`로 리디렉트

신규 유저 감지 쿼리 예시:
```typescript
const { data: existingUser } = await supabase
  .from('users')
  .select('id')
  .eq('id', session.user.id)
  .single()

const isNewUser = !existingUser
```

보안 규칙:
- `session.user.id`로만 `users` 테이블을 조회한다. 다른 사용자 데이터에 접근하지 않는다.
- `exchangeCodeForSession`에서 반환된 세션만 신뢰한다. 쿼리파라미터의 다른 값을 신뢰하지 않는다.
- 리디렉트 URL은 하드코딩된 내부 경로만 사용한다. 외부 URL로 리디렉트 금지 (Open Redirect 취약점).

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `app/auth/callback/route.ts`가 Route Handler 형식인가? (`export async function GET`)
   - `createServerClient`(서버용)를 사용하는가? (`lib/supabase-server.ts` 임포트)
   - 리디렉트 URL이 `/`, `/dashboard`, `/onboarding` 등 내부 경로만 사용하는가?
   - 에러 케이스(`code` 없음, `exchangeCodeForSession` 실패)가 모두 처리됐는가?
3. 결과에 따라 `phases/3-kakao-auth/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "app/auth/callback/route.ts 생성 완료: OAuth 코드 교환, 신규/기존 유저 분기(users 테이블 조회), /onboarding 또는 /dashboard 리디렉트"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `createBrowserClient`(브라우저용 클라이언트) 사용 금지. 이유: Route Handler는 서버 환경에서 실행되므로 반드시 `createServerClient`를 사용해야 한다.
- 쿼리파라미터에서 `redirectTo` 같은 리디렉트 대상을 받아서 사용 금지. 이유: Open Redirect 취약점으로 이어진다.
- `users` 테이블에 직접 `plan` 컬럼을 INSERT/UPDATE 금지. 이유: CLAUDE.md CRITICAL 규칙 — plan 컬럼은 서버에서만 업데이트 가능하나, 신규 유저 레코드 생성은 온보딩(Phase 4)에서 처리한다.
- `app/auth/callback/` 외부에 인증 콜백 로직 구현 금지. 이유: CLAUDE.md CRITICAL 규칙 — 모든 API 로직은 Route Handler에서만 처리한다.
