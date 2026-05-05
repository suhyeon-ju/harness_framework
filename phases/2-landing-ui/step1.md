# Step 1: plan-table

## 읽어야 할 파일

먼저 아래 파일들을 읽고 플랜 구성, 타입, 기존 페이지 구조를 파악하라:

- `CLAUDE.md` — 플랜 비교표 (무료/프로 기능 7개 항목), UI 디자인 방향
- `docs/UI_GUIDE.md` — AI 슬롭 안티패턴
- `types/index.ts` — Plan, PLAN_LIMITS 타입/상수 (Phase 1 생성)
- `app/page.tsx` — Step 0에서 구현한 Hero 섹션 (여기에 PlanTable 추가)
- `components/KakaoLoginButton.tsx` — Step 0에서 생성한 버튼 컴포넌트

## 작업

플랜 비교표 컴포넌트를 만들고 랜딩 페이지에 통합한다.

### `components/PlanTable.tsx`

서버 컴포넌트 (클라이언트 상태 불필요).

```typescript
// 시그니처 수준 가이드
export default function PlanTable() { ... }
```

CLAUDE.md의 플랜 비교표 7개 항목을 모두 표시한다:

| 기능 | 무료 | 프로 (월 5,000원) |
|------|------|------|
| 글 생성 | 1일 1개 | 1일 3개 |
| 주제 설정 | 직접 입력만 | 자동 생성 + 직접 입력 |
| AI 보완 옵션 | ❌ | ✅ (하루 10회 제한) |
| 자동 생성 기간 설정 | ❌ | ✅ |
| 보관함 저장 | 7일만 보관 | 무제한 |
| 해시태그 자동 추가 | ❌ | ✅ |

구현 요구사항:
- `types/index.ts`의 `PLAN_LIMITS` 상수를 참조해 숫자 값 표시 (하드코딩 금지)
- ✅/❌ 대신 텍스트 혼합 사용 가능 (가독성 우선)
- 무료 / 프로 두 컬럼을 명확히 구분
- 프로 컬럼에 월 가격 "월 5,000원" 표시
- 모바일에서 가로 스크롤 없이 표시되도록 설계 (`w-full`, 반응형 레이아웃)
- Tailwind CSS만 사용

### `app/page.tsx` 수정

기존 Hero 섹션을 유지하면서 `<PlanTable />`을 추가한다.

추가 위치: `<KakaoLoginButton />` 아래에 플랜 비교 섹션 삽입.
하단에 CTA를 한 번 더 반복 (플랜 비교표 아래 `<KakaoLoginButton />`).

최종 페이지 구조:
```
Hero (서비스명 + 캐치프레이즈 + 설명)
KakaoLoginButton  ← 상단 CTA
PlanTable         ← 플랜 비교표
KakaoLoginButton  ← 하단 CTA (동일 컴포넌트 재사용)
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
   - `PlanTable`이 `components/` 폴더에 있는가?
   - `PlanTable`에 `"use client"`가 없는가? (서버 컴포넌트)
   - PLAN_LIMITS 상수를 임포트해 숫자를 참조하는가? (하드코딩 없음)
   - CLAUDE.md 플랜 비교표 7개 항목이 모두 표시되는가?
   - `docs/UI_GUIDE.md` 안티패턴을 위반하지 않았는가?
3. 결과에 따라 `phases/2-landing-ui/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "components/PlanTable.tsx(무료/프로 7개 항목 비교표, PLAN_LIMITS 참조) 생성 및 app/page.tsx에 통합 완료. Phase 2 전체 완료."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 플랜 숫자 값(1, 3, 7, 10 등)을 컴포넌트 내부에 하드코딩 금지. 이유: `types/index.ts`의 `PLAN_LIMITS`가 단일 진실 소스다. 나중에 플랜 수치가 바뀌면 한 곳만 수정하면 된다.
- `<table>` HTML 요소 대신 복잡한 CSS grid/flex 레이아웃 구성 금지 — 단순한 테이블로 구현한다. 이유: 비교표는 시맨틱하게 `<table>`을 사용하는 것이 접근성과 유지보수에 유리하다.
- `PlanTable`에 `"use client"` 추가 금지. 이유: 정적 데이터만 표시하므로 서버 컴포넌트로 충분하다.
- 기존 `app/page.tsx` Hero 섹션 내용 삭제/변경 금지. 이유: Step 0의 산출물을 유지해야 한다.
