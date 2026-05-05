# doPOST

## 기술 스택
- Next.js 15
- TypeScript strict mode
- Tailwind CSS
- Supabase (DB + Auth)
- Claude API (글 생성)
- 배포: Vercel / 로그인: 카카오 / 결제: 토스페이먼츠 (Phase 11)

## 아키텍처 규칙
- CRITICAL: 모든 API 로직은 app/api/ 라우트 핸들러에서만 처리
- CRITICAL: 클라이언트 컴포넌트에서 직접 외부 API 호출 금지
- CRITICAL: Claude API 키는 서버에서만 사용 (클라이언트 노출 금지)
- CRITICAL: Supabase plan 컬럼은 서버에서만 업데이트 (클라이언트 직접 변경 금지)
- CRITICAL: Threads 액세스 토큰은 서버에서만 사용 (클라이언트 노출 금지)
- 컴포넌트는 components/ 폴더에 저장
- 타입은 types/ 폴더에 분리
- 재사용 로직은 hooks/ 폴더에 분리
- 환경변수는 .env.local 에서만 관리

## 개발 프로세스
- 커밋 메시지는 conventional commits 형식 사용 (feat / fix / docs / refactor)
- 작업 단위는 작게 나눠서 진행 (한 번에 하나씩)
- 각 단계 완료 후 빌드 확인 후 push

## 명령어
```
npm run dev       # 개발 서버
npm run build     # 프로덕션 빌드
npm run lint      # ESLint
npx tsc --noEmit  # 타입 체크
```

## 개발 규칙

### 공통
- 모든 코드는 TypeScript
- Tailwind CSS만 사용 (별도 CSS 파일 금지)
- 모바일 우선 반응형 (모바일 → PC 순서로 작성)
- 컴포넌트 Props 타입 항상 정의

### 컴포넌트
- 재사용 컴포넌트는 components/ 폴더
- 로딩 상태 항상 포함
- 에러 상태 항상 포함
- 빈 상태(데이터 없음) UI 항상 포함

### API
- 모든 API 호출 try/catch 필수
- 로딩 / 에러 / 성공 상태 항상 관리
- API 키 코드에 직접 입력 금지
- 글 생성 버튼 디바운스 처리 필수 (중복 호출 방지)
- API Route에서 하루 생성 횟수 서버 사이드 체크 필수

### Supabase
- 모든 쿼리 에러 처리 필수
- 인증 상태 확인 후 데이터 접근
- RLS (Row Level Security) 항상 적용

### 플랜 제한
- 유료 기능 접근 시 `hooks/usePlan.ts`로 플랜 체크
- 무료 플랜 접근 시 `components/UpgradeModal.tsx` 출력
- 3중 보안 설계 상세 → `docs/ADR.md` ADR-002 참조

## 프로젝트 구조
```
app/                  ← 페이지
components/           ← 공통 컴포넌트
hooks/                ← 커스텀 훅
lib/                  ← 유틸 함수 / Supabase 클라이언트
types/                ← TypeScript 타입 정의
```

## 주요 파일 경로
```
app/page.tsx                  ← 랜딩 페이지
app/dashboard/page.tsx        ← 대시보드
app/generate/page.tsx         ← 글 생성
app/history/page.tsx          ← 보관함
app/settings/page.tsx         ← 설정
app/onboarding/page.tsx       ← 온보딩
components/BottomTabBar.tsx   ← 하단 탭 바
components/UpgradeModal.tsx   ← 유료 전환 팝업
hooks/usePlan.ts              ← 플랜 체크 훅
hooks/useAuth.ts              ← 인증 훅
lib/supabase.ts               ← Supabase 브라우저 클라이언트
lib/supabase-server.ts        ← Supabase 서버 클라이언트
```

## 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
KAKAO_CLIENT_ID=
TOSS_CLIENT_KEY=
TOSS_SECRET_KEY=
```

## 개발 우선순위
```
1단계: 프로젝트 세팅 + 환경변수 설정      ✅
2단계: 랜딩 페이지 UI                    ✅
3단계: 카카오 로그인 + Supabase Auth 연동  ✅
4단계: 온보딩 페이지
5단계: 대시보드 (요일 탭 + 색상 구분)
6단계: 글 자동 생성 (Claude API 연동)
7단계: AI 보완 옵션
8단계: 보관함
9단계: 설정 페이지
10단계: 무료/유료 플랜 제한 + UpgradeModal
11단계: 구독 결제 연동 (토스페이먼츠)
12단계: 인스타그램 확장
13단계: Threads API 연동 (OAuth + 자동 업로드)
```

## Threads API 연동 설계 (13단계)

### 환경변수 (Phase 13에 추가)
```
THREADS_APP_ID=
THREADS_APP_SECRET=
THREADS_REDIRECT_URI=
```

### users 테이블 추가 컬럼 (Phase 13)
```
threads_access_token (암호화 저장)
threads_user_id
threads_connected_at
threads_token_expires_at
```

### API Route (Phase 13)
```
app/api/threads/connect/route.ts   ← OAuth 연동
app/api/threads/publish/route.ts   ← 게시글 업로드
app/api/threads/status/route.ts    ← 업로드 상태 확인
```
