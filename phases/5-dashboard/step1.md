# Step 1: dashboard-shell

## 읽어야 할 파일

먼저 아래 파일들을 읽고 데이터 구조, 비즈니스 로직, 기존 컴포넌트를 파악하라:

- `CLAUDE.md` — 아키텍처 규칙, 플랜 제한
- `docs/PRD.md` — 대시보드 스펙 (헤더·요일 탭·콘텐츠 영역 상세)
- `docs/ADR.md` — ADR-001 Supabase 스키마, ADR-002 플랜 보안 설계
- `docs/UI_GUIDE.md` — 색상 시스템, 타이포그래피
- `types/index.ts` — Plan, Industry, PLAN_LIMITS (Phase 1 생성)
- `types/database.ts` — UserRow, PostRow (Phase 1 생성)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `components/BottomTabBar.tsx` — Step 0에서 생성한 탭 바
- `app/dashboard/layout.tsx` — Step 0에서 생성한 레이아웃

## 작업

대시보드 데이터 페칭, 헤더, 요일 탭 UI를 구현한다.

### `app/dashboard/page.tsx`

서버 컴포넌트. 유저 정보와 이번 주 게시글 데이터를 페칭해 클라이언트 컴포넌트에 전달한다.

```typescript
// 시그니처 수준 가이드
export default async function DashboardPage() {
  // 1. createServerClient로 현재 유저 확인 (미인증 시 redirect('/'))
  // 2. users 테이블에서 유저 정보 조회 (industry, plan)
  //    - 온보딩 미완료(레코드 없음) 시 redirect('/onboarding')
  // 3. 이번 주 월~일 날짜 범위 계산
  // 4. posts 테이블에서 해당 user_id + 날짜 범위로 조회
  // 5. <DashboardClient> 에 데이터 전달
}
```

이번 주 날짜 범위 계산:
- 한국 기준 이번 주 월요일 00:00:00 ~ 일요일 23:59:59 (KST, UTC+9)
- `created_at` 컬럼 기준으로 필터링

### `components/DashboardClient.tsx`

`"use client"` 클라이언트 컴포넌트. 선택된 날짜 상태를 관리하고 하위 컴포넌트를 조율한다.

```typescript
// 시그니처 수준 가이드
interface DashboardClientProps {
  user: UserRow
  posts: PostRow[]
  weekDates: string[]   // ISO 날짜 문자열 배열 (월~일, 7개)
  todayStr: string      // 오늘 날짜 ISO 문자열
  remainingCount: number // 오늘 남은 생성 횟수
}

export default function DashboardClient({
  user, posts, weekDates, todayStr, remainingCount,
}: DashboardClientProps) {
  const [selectedDate, setSelectedDate] = useState(todayStr)
  // selectedDate에 해당하는 posts 필터링 후 렌더링
}
```

헤더 구현:
- 업종명: `industry` 값을 한글로 변환해 표시
  - `cafe` → "☕ 카페", `restaurant` → "🍽️ 음식점", `realestate` → "🏠 부동산", `hairsalon` → "✂️ 헤어샵", 그 외 → `industry` 값 그대로 표시
- 남은 횟수: `{remainingCount}/{PLAN_LIMITS[user.plan].dailyPosts}` 형식
- 스타일: `text-sm text-gray-500`

### `components/WeekTab.tsx`

순수 UI 컴포넌트. 요일 탭을 렌더링하고 선택 이벤트를 상위로 전달한다.

```typescript
// 시그니처 수준 가이드
interface WeekTabProps {
  weekDates: string[]      // ISO 날짜 문자열 7개 (월~일)
  selectedDate: string
  todayStr: string
  posts: PostRow[]         // 점 색상 계산에 사용
  onSelectDate: (date: string) => void
}

export default function WeekTab({
  weekDates, selectedDate, todayStr, posts, onSelectDate,
}: WeekTabProps) { ... }
```

탭 스펙:
- 요일명: "월" "화" "수" "목" "금" "토" "일" (date에서 계산)
- 날짜 숫자: "5" "6" ... (일 단위)
- 오늘: `bg-orange-500 text-white rounded-full` 강조
- 선택된 날 (오늘 아닌 경우): `border-b-2 border-orange-500`
- 점 표시 (탭 아래):
  - 해당 날짜 posts 없음: 점 없음
  - `is_uploaded: false` 게시글 있음: 주황 점 (`bg-orange-400 w-1.5 h-1.5 rounded-full`)
  - `is_uploaded: true` 게시글만 있음: 초록 점 (`bg-green-500 w-1.5 h-1.5 rounded-full`)
- 탭 레이아웃: `grid grid-cols-7 gap-1`

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `app/dashboard/page.tsx`가 서버 컴포넌트인가? (async function, `"use client"` 없음)
   - 미인증 유저와 온보딩 미완료 유저를 redirect로 차단하는가?
   - `DashboardClient`에 `"use client"`가 있는가?
   - `WeekTab`에 `"use client"`가 없는가? (props로만 동작하는 순수 UI)
   - `PLAN_LIMITS` 상수로 남은 횟수를 계산하는가? (하드코딩 없음)
3. 결과에 따라 `phases/5-dashboard/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "app/dashboard/page.tsx(유저+이번주 posts 페칭, redirect 처리), DashboardClient.tsx(선택날짜 상태, 헤더 업종명+남은횟수), WeekTab.tsx(7탭, 오늘강조, 미업로드/완료 점 구분) 생성 완료"`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `app/dashboard/page.tsx`에서 클라이언트 사이드로 posts를 fetch 금지. 이유: 서버 컴포넌트에서 직접 Supabase를 조회해야 초기 로딩이 빠르고 RLS가 올바르게 적용된다.
- 요일 이름("월화수목금토일")을 하드코딩된 인덱스 배열로 처리 금지. 이유: `weekDates`의 ISO 날짜 문자열에서 `Date` 객체를 생성해 `toLocaleDateString('ko-KR', { weekday: 'short' })`로 계산한다.
- 남은 횟수를 `posts.length`로 직접 계산 금지. 이유: `remainingCount`는 서버에서 계산해 전달한다. 오늘 생성된 posts만 카운트해야 하므로 서버에서 정확히 필터링한다.
