# Step 0: onboarding-ui

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 타입 구조, 디자인 시스템, 인증 구조를 파악하라:

- `CLAUDE.md` — 아키텍처 규칙, 프로젝트 구조
- `docs/PRD.md` — 온보딩 페이지 스펙 (업종/말투 선택 옵션 목록)
- `docs/UI_GUIDE.md` — 색상, 버튼, 카드 컴포넌트 스펙
- `types/index.ts` — Industry, Tone 타입 (Phase 1 생성)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `hooks/useAuth.ts` — 인증 훅 (Phase 3 생성)

## 작업

온보딩 페이지의 멀티스텝 선택 UI를 구현한다. 이 step에서는 API 제출 로직은 구현하지 않는다.

### `app/onboarding/page.tsx`

서버 컴포넌트. 페이지 진입 시 이미 온보딩을 완료한 유저를 차단한다.

```typescript
// 시그니처 수준 가이드
export default async function OnboardingPage() {
  // 1. createServerClient로 현재 유저 확인
  // 2. users 테이블에서 해당 user.id로 레코드 조회
  // 3. 레코드가 존재하면 redirect('/dashboard')
  // 4. 레코드가 없으면 <OnboardingFlow /> 렌더링
}
```

### `components/OnboardingFlow.tsx`

`"use client"` 클라이언트 컴포넌트. 업종과 말투를 순서대로 선택하는 멀티스텝 UI.

```typescript
// 시그니처 수준 가이드
interface OnboardingFlowProps {}

export default function OnboardingFlow({}: OnboardingFlowProps) {
  // step: 1 | 2
  // selectedIndustry: Industry | null
  // customIndustry: string  (industry === 'custom' 일 때 사용)
  // selectedTone: Tone | null
}
```

#### 레이아웃 구조
```
<div> ← max-w-md mx-auto px-4 py-8
  <!-- 진행 표시 -->
  <!-- 단계 제목 -->
  <!-- 선택 옵션 목록 -->
  <!-- 다음/완료 버튼 -->
</div>
```

#### 진행 표시 (상단)
- "1/2" 또는 "2/2" 텍스트 표시
- 진행 바: `w-full bg-gray-200 rounded-full h-1` 위에 `bg-orange-500 rounded-full h-1` 너비 50% / 100%

#### Step 1 — 업종 선택
제목: "어떤 업종이세요?"

6개 옵션을 카드 형태로 표시:
| 값 | 표시 텍스트 |
|----|------------|
| `cafe` | ☕ 카페 |
| `restaurant` | 🍽️ 음식점 |
| `realestate` | 🏠 부동산 |
| `hairsalon` | ✂️ 헤어샵 |
| `custom` | ✏️ 직접 입력 |

- `custom` 선택 시: 카드 아래 텍스트 입력 필드 노출 (`placeholder="업종명을 입력하세요"`)
- 선택된 카드: `border-orange-500 bg-orange-50` 강조
- 미선택 카드: `border-gray-200 bg-white`
- "다음" 버튼: 업종이 선택된 경우에만 활성화 (`disabled` + `opacity-50` 처리)

#### Step 2 — 말투 선택
제목: "어떤 말투로 쓸까요?"

5개 옵션을 카드 형태로 표시:
| 값 | 표시 텍스트 | 설명 |
|----|------------|------|
| `casual` | 반말체 | 친한 친구에게 말하듯 |
| `formal` | 존댓말체 | 정중하고 격식 있게 |
| `friendly` | 친근한 말투 | 동네 단골손님처럼 편안하게 |
| `informative` | 정보 전달형 | 핵심 정보만 간결하게 |
| `empathetic` | 공감 유도형 | 공감과 질문을 유도하는 방식으로 |

- 선택 스타일은 Step 1과 동일
- "완료" 버튼: 말투가 선택된 경우에만 활성화
- "완료" 클릭 시: Step 1에서 구현 예정 (`// TODO: Step 1 — onboarding-submit`)

#### 디자인 규칙
- `docs/UI_GUIDE.md`의 색상·버튼·카드 스펙 준수
- 카드: `rounded-lg border p-4 cursor-pointer transition-colors`
- 버튼 Primary: `rounded-lg bg-orange-500 text-white py-3 w-full`
- "뒤로" 버튼: Step 2에서만 표시, `text-gray-500` 텍스트 버튼

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `app/onboarding/page.tsx`는 서버 컴포넌트인가? (`"use client"` 없음)
   - `components/OnboardingFlow.tsx`에 `"use client"`가 있는가?
   - `Industry`, `Tone` 타입을 `types/index.ts`에서 임포트해 사용하는가? (하드코딩 없음)
   - `docs/UI_GUIDE.md` 안티패턴을 위반하지 않았는가?
3. 결과에 따라 `phases/4-onboarding/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "app/onboarding/page.tsx(서버 컴포넌트, 기존 유저 redirect), components/OnboardingFlow.tsx(멀티스텝 UI: 업종 6개+직접입력/말투 5개, 진행 표시) 생성 완료"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `app/onboarding/page.tsx`에 `"use client"` 추가 금지. 이유: 서버 컴포넌트에서 Supabase로 기존 유저를 체크해야 하므로 서버 컴포넌트여야 한다.
- `OnboardingFlow.tsx`에서 `/api/onboarding` API 호출 구현 금지. 이유: API 연동은 Step 1에서 담당한다. 이 step은 UI만 구현한다. "완료" 버튼 onClick은 TODO 주석으로 남긴다.
- `Industry`, `Tone` 값을 컴포넌트 내부에 문자열 배열로 하드코딩 금지. 이유: `types/index.ts`가 단일 진실 소스다.
- 외부 UI 라이브러리(shadcn, radix 등) 설치 금지. 이유: Tailwind CSS만 사용한다.
