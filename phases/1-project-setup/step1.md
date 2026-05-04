# Step 1: supabase-client

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 기술 스택, 아키텍처 규칙, Supabase 테이블 구조를 파악하라:

- `CLAUDE.md`
- `package.json` (Step 0에서 생성)
- `tsconfig.json` (Step 0에서 생성)

## 작업

Supabase 클라이언트를 브라우저용과 서버용으로 분리하여 설정한다.

### 패키지 설치

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### `lib/supabase.ts` — 브라우저 클라이언트

`createBrowserClient`를 사용하는 싱글톤 패턴으로 구현한다.

```typescript
// 시그니처 수준 가이드
export function createClient() { ... }
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 사용
- 클라이언트 컴포넌트(`"use client"`)에서 호출하는 용도

### `lib/supabase-server.ts` — 서버 클라이언트

`createServerClient`와 Next.js `cookies()`를 사용하여 서버 컴포넌트 및 Route Handler에서 사용할 클라이언트를 반환한다.

```typescript
// 시그니처 수준 가이드
export async function createServerClient() { ... }
```

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경변수 사용
- `next/headers`의 `cookies()`를 통해 쿠키 읽기/쓰기 처리
- Route Handler와 Server Component 양쪽에서 호출 가능하도록 구현

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `lib/supabase.ts`가 브라우저 전용(`createBrowserClient`)인가?
   - `lib/supabase-server.ts`가 서버 전용(`createServerClient` + cookies)인가?
   - 환경변수를 코드에 하드코딩하지 않았는가?
   - CLAUDE.md CRITICAL 규칙 — 클라이언트 컴포넌트에서 직접 외부 API 호출이 없는가?
3. 결과에 따라 `phases/1-project-setup/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "lib/supabase.ts(브라우저용 createBrowserClient), lib/supabase-server.ts(서버용 createServerClient+cookies) 생성 완료"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `SUPABASE_SERVICE_ROLE_KEY`를 `lib/supabase.ts`(브라우저 클라이언트)에서 사용 금지. 이유: Service Role Key는 RLS를 우회하므로 절대 클라이언트에 노출되면 안 된다. 서버 전용 로직에서만 사용한다.
- `lib/supabase-server.ts`에 `"use client"` 추가 금지. 이유: 서버 클라이언트는 서버 환경에서만 실행되어야 한다.
- 환경변수를 코드에 직접 하드코딩 금지. 이유: CLAUDE.md API 규칙 위반이며 보안 사고로 이어진다.
