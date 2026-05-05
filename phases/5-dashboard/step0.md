# Step 0: bottom-tab-bar

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 라우팅 구조, 디자인 시스템, 컴포넌트 규칙을 파악하라:

- `CLAUDE.md` — 주요 파일 경로 (BottomTabBar.tsx 명시됨), 컴포넌트 규칙
- `docs/PRD.md` — 대시보드 하단 탭 바 스펙 (🏠 홈 / ✍️ 생성 / 📂 보관함 / ⚙️ 설정)
- `docs/UI_GUIDE.md` — 하단 탭 바 색상/레이아웃 스펙, 디자인 원칙

## 작업

모든 주요 페이지에서 공유하는 하단 탭 바 컴포넌트와 대시보드 레이아웃을 구현한다.

### `components/BottomTabBar.tsx`

`"use client"` 클라이언트 컴포넌트. 현재 경로를 감지해 활성 탭을 강조한다.

```typescript
// 시그니처 수준 가이드
export default function BottomTabBar() {
  const pathname = usePathname()
  // 탭 목록을 배열로 정의해 반복 렌더링
}
```

탭 구성:
| 아이콘 | 라벨 | 경로 |
|--------|------|------|
| 🏠 (home SVG) | 홈 | `/dashboard` |
| ✍️ (edit SVG) | 생성 | `/generate` |
| 📂 (folder SVG) | 보관함 | `/history` |
| ⚙️ (settings SVG) | 설정 | `/settings` |

구현 요구사항:
- 레이아웃: `fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50`
- 내부 컨테이너: `max-w-md mx-auto flex justify-around items-center h-16`
- 각 탭 버튼: `flex flex-col items-center gap-1 py-2 px-4`
- 활성 탭: 아이콘·라벨 `text-orange-500`
- 비활성 탭: `text-gray-400`
- 라벨: `text-xs`
- 아이콘: SVG 인라인, `w-5 h-5`, `strokeWidth={1.5}` (`docs/UI_GUIDE.md` 아이콘 규칙)
- `<Link>` 사용 (Next.js `next/link`)

### `app/dashboard/layout.tsx`

서버 컴포넌트. `<BottomTabBar />`를 하단에 고정하고 콘텐츠 영역에 하단 여백을 확보한다.

```typescript
// 시그니처 수준 가이드
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) { ... }
```

구현 요구사항:
- `children` 영역: `pb-20` (탭 바 높이 80px 만큼 하단 여백)
- `<BottomTabBar />`를 레이아웃 하단에 포함

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `components/BottomTabBar.tsx`에 `"use client"`가 있는가?
   - `usePathname()`으로 현재 경로를 감지하는가?
   - `app/dashboard/layout.tsx`는 서버 컴포넌트인가? (`"use client"` 없음)
   - 아이콘이 외부 라이브러리 없이 SVG 인라인으로 구현됐는가?
   - `docs/UI_GUIDE.md` 안티패턴을 위반하지 않았는가?
3. 결과에 따라 `phases/5-dashboard/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "components/BottomTabBar.tsx(4탭 fixed 하단바, usePathname 활성탭 강조), app/dashboard/layout.tsx(pb-20 여백 포함) 생성 완료"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- 외부 아이콘 라이브러리(lucide-react, react-icons 등) 설치 금지. 이유: `docs/UI_GUIDE.md` 규칙 — SVG 인라인만 허용한다.
- `app/dashboard/layout.tsx`에 `"use client"` 추가 금지. 이유: layout은 서버 컴포넌트여야 한다. `usePathname`은 `BottomTabBar` 내부에서만 사용한다.
- `BottomTabBar`에서 `<a>` 태그 직접 사용 금지. 이유: Next.js App Router에서는 `<Link>`를 사용해야 클라이언트 사이드 네비게이션이 동작한다.
