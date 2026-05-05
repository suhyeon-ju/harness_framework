# Step 0: landing-hero

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 디자인 방향, 타입 구조, 기존 설정을 파악하라:

- `CLAUDE.md` — 서비스 개요, UI 디자인 방향, 개발 규칙
- `docs/UI_GUIDE.md` — AI 슬롭 안티패턴 (금지 사항 목록)
- `types/index.ts` — Plan, Industry, Tone, EmojiLevel 타입 (Phase 1 생성)
- `app/layout.tsx` — 기존 루트 레이아웃
- `app/page.tsx` — 현재 placeholder 페이지

## 작업

랜딩 페이지 Hero 섹션과 카카오 로그인 버튼을 구현한다.

### `components/KakaoLoginButton.tsx`

클라이언트 컴포넌트(`"use client"`). 카카오 브랜드 버튼 UI만 구현한다.

```typescript
// 시그니처 수준 가이드
interface KakaoLoginButtonProps {
  className?: string
}

export default function KakaoLoginButton({ className }: KakaoLoginButtonProps) { ... }
```

요구사항:
- 배경색: `bg-[#FEE500]` (카카오 공식 브랜드 색)
- 텍스트: `text-[#3C1E1E]` (카카오 공식 텍스트 색) + "카카오로 시작하기"
- 카카오 로고: 아래 SVG path를 인라인으로 사용한다 (외부 라이브러리 금지)
  - 카카오 말풍선 아이콘 SVG (viewBox="0 0 24 24"): `<path fill="currentColor" d="M12 3C6.48 3 2 6.48 2 11c0 2.76 1.5 5.2 3.8 6.72l-.96 3.56 3.72-2.46C9.46 19 10.71 19 12 19c5.52 0 10-3.48 10-8S17.52 3 12 3z"/>`
- `onClick`: Phase 3에서 실제 인증을 연결할 자리. 현재는 빈 함수로 구현
  ```typescript
  const handleLogin = () => {
    // TODO: Phase 3 — Kakao OAuth 연동
  }
  ```
- 전체 너비: `w-full`
- 패딩: `py-3 px-4`
- 모서리: `rounded-lg`
- 아이콘과 텍스트를 가로로 나열 (`flex items-center justify-center gap-2`)

### `app/page.tsx`

서버 컴포넌트 (최상단에 `"use client"` 넣지 말 것).

레이아웃 구조:
```
<main>
  <div>  ← 전체 래퍼: max-w-md mx-auto px-6 py-12
    <!-- 로고/서비스명 -->
    <!-- 캐치프레이즈 -->
    <!-- 서비스 설명 -->
    <!-- KakaoLoginButton -->
    <!-- (이후 step에서 PlanTable이 들어올 자리) -->
  </div>
</main>
```

콘텐츠 요구사항:
- 서비스명: "doPOST" — `text-2xl font-bold`
- 캐치프레이즈: "매일 뭐 올릴지 고민하지 말고, 그냥 포스팅 해" — `text-lg font-medium`
- 설명: "자영업자를 위한 Threads 자동 글쓰기 툴" — `text-sm text-gray-500`
- `<KakaoLoginButton />` 삽입 (설명 아래)
- 섹션 간 간격: `space-y-4` 또는 `mt-*` 일관되게 사용

### 디자인 규칙

- 모바일 우선: `max-w-md` 기준으로 작성 후 PC 확인
- Tailwind CSS만 사용 (별도 CSS 파일 추가 금지)
- 배경: 흰색(`bg-white`) 또는 기본값 유지
- 텍스트 계층: 서비스명 → 캐치프레이즈 → 설명 → 버튼 순으로 시각적 위계
- `docs/UI_GUIDE.md` 안티패턴 엄수:
  - gradient text 금지
  - backdrop-blur 금지
  - glow 애니메이션 금지
  - 보라/인디고 색상 금지
  - blur-3xl 배경 orb 금지

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `KakaoLoginButton`이 `components/` 폴더에 있는가?
   - `app/page.tsx`는 서버 컴포넌트인가? (`"use client"` 없음)
   - `KakaoLoginButton`의 `onClick`이 Phase 3 TODO 주석과 함께 빈 함수로 구현됐는가?
   - CLAUDE.md CRITICAL 규칙 — 클라이언트에서 직접 외부 API 호출이 없는가?
3. 결과에 따라 `phases/2-landing-ui/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "app/page.tsx(Hero 섹션: 서비스명/캐치프레이즈/설명), components/KakaoLoginButton.tsx(카카오 브랜드 UI, onClick placeholder) 생성 완료"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `KakaoLoginButton`에 실제 Kakao OAuth 로직 구현 금지. 이유: 인증 로직은 Phase 3에서 다룬다. 지금은 UI만 구현한다.
- `app/page.tsx`에 `"use client"` 추가 금지. 이유: 랜딩 페이지는 서버 컴포넌트로 유지해야 SEO와 초기 로딩 성능이 좋다.
- 외부 아이콘 라이브러리(lucide-react, react-icons 등) 설치 금지. 이유: Phase 1에서 정의한 의존성 외 추가 패키지는 별도 논의 없이 추가하지 않는다.
- `components/` 외부에 재사용 컴포넌트 생성 금지. 이유: CLAUDE.md 프로젝트 구조 규칙.
