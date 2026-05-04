# Step 0: next-init

## 읽어야 할 파일

먼저 아래 파일을 읽고 프로젝트의 기술 스택, 아키텍처 규칙, 환경변수 목록을 파악하라:

- `CLAUDE.md`

## 작업

이 디렉토리(`harness_framework/`)에 Next.js 15 프로젝트를 직접 파일 생성 방식으로 초기화한다.
`npx create-next-app`은 **사용하지 마라** — 현재 디렉토리에 이미 파일이 존재해 CLI가 실패하거나 기존 파일을 덮어쓸 수 있다.

### 생성할 파일 목록

#### `package.json`
아래 의존성을 포함한다:
- `next`: `^15.0.0`
- `react`: `^19.0.0`
- `react-dom`: `^19.0.0`
- `@types/node`, `@types/react`, `@types/react-dom`, `typescript`: devDependencies
- `tailwindcss`, `postcss`, `autoprefixer`: devDependencies
- scripts: `dev`, `build`, `start`, `lint`

#### `next.config.ts`
기본 Next.js 15 설정. 별도 커스터마이징 없음.

#### `tsconfig.json`
- `strict: true` 필수
- `paths`: `"@/*": ["./*"]`
- `target`: `ES2017` 이상
- `moduleResolution`: `bundler`

#### `tailwind.config.ts`
- `content`: `["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"]`

#### `postcss.config.mjs`
Tailwind + autoprefixer 기본 설정.

#### `app/layout.tsx`
- `RootLayout` 서버 컴포넌트
- `<html lang="ko">` 설정
- Tailwind 글로벌 CSS import

#### `app/page.tsx`
- 빈 랜딩 페이지 placeholder (`<main>doPOST</main>` 수준)
- `"use client"` 불필요 — 서버 컴포넌트로 유지

#### `app/globals.css`
- Tailwind directives (`@tailwind base`, `components`, `utilities`) 포함

#### `.env.local.example`
CLAUDE.md에 명시된 환경변수 7개를 빈 값으로 나열:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
KAKAO_CLIENT_ID=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

### 생성할 빈 디렉토리
아래 디렉토리를 생성하고 각각에 `.gitkeep` 파일을 넣는다:
- `components/`
- `hooks/`
- `lib/`
- `types/`

## Acceptance Criteria

```bash
npm install
npm run build
npx tsc --noEmit
```

세 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `tsconfig.json`에 `"strict": true`가 설정되어 있는가?
   - `app/` 디렉토리 구조를 사용하는가? (`src/` 없음)
   - `components/`, `hooks/`, `lib/`, `types/` 폴더가 모두 존재하는가?
3. 결과에 따라 `phases/1-project-setup/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Next.js 15 프로젝트 초기화 완료: package.json, tsconfig.json(strict), tailwind 설정, app/layout.tsx, .env.local.example, components/hooks/lib/types/ 폴더 생성"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `npx create-next-app` 실행 금지. 이유: 이미 파일이 있는 디렉토리에서 실패하거나 CLAUDE.md, docs/ 등 기존 파일을 덮어쓸 수 있다.
- `src/` 디렉토리 생성 금지. 이유: CLAUDE.md 프로젝트 구조는 `src/` 없이 루트에 `app/`을 둔다.
- `app/page.tsx`에 `"use client"` 추가 금지. 이유: 랜딩 페이지는 서버 컴포넌트로 시작해야 한다.
- `.env.local` 파일 생성 금지. 이유: 실제 키 값이 없는 상태에서 만들면 빌드가 깨질 수 있다. `.env.local.example`만 생성한다.
