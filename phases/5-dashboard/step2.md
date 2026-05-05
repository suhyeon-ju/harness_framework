# Step 2: post-cards

## 읽어야 할 파일

먼저 아래 파일들을 읽고 기존 컴포넌트 구조, DB 스키마, 보안 규칙을 파악하라:

- `CLAUDE.md` — 아키텍처 규칙 (CRITICAL: 모든 API 로직은 Route Handler에서만)
- `docs/PRD.md` — 대시보드 콘텐츠 영역 스펙 (오늘/다른 날 카드 동작, 버튼 목록)
- `docs/UI_GUIDE.md` — 카드, 버튼 컴포넌트 스펙
- `types/database.ts` — PostRow 타입 (Phase 1 생성)
- `lib/supabase-server.ts` — 서버용 Supabase 클라이언트 (Phase 1 생성)
- `app/dashboard/page.tsx` — Step 1에서 생성한 대시보드 페이지
- `components/DashboardClient.tsx` — Step 1에서 생성한 클라이언트 컴포넌트

## 작업

게시글 카드 UI와 업로드완료·삭제 액션을 구현한다.

### `components/PostCard.tsx`

`"use client"` 클라이언트 컴포넌트.

```typescript
// 시그니처 수준 가이드
interface PostCardProps {
  post: PostRow
  isToday: boolean
  onUploaded: (postId: string) => void   // 업로드완료 후 로컬 상태 갱신용 콜백
  onDeleted: (postId: string) => void    // 삭제 후 로컬 상태 갱신용 콜백
}

export default function PostCard({
  post, isToday, onUploaded, onDeleted,
}: PostCardProps) { ... }
```

#### 오늘 날짜 카드 (`isToday: true`)
- 전체 `content` 표시 (`whitespace-pre-wrap text-sm text-gray-700`)
- 버튼 4개 (가로 배열):
  - **복사**: `navigator.clipboard.writeText(post.content)` 후 "복사됨!" 피드백 (1.5초)
  - **업로드완료**: `PATCH /api/posts/[id]` 호출 → 성공 시 `onUploaded(post.id)` 콜백
    - 이미 `is_uploaded: true`이면 버튼 비노출 (이미 완료된 경우)
  - **삭제**: confirm 다이얼로그 → `DELETE /api/posts/[id]` 호출 → 성공 시 `onDeleted(post.id)` 콜백
- 카드 스타일: `rounded-lg bg-gray-50 border border-gray-200 p-4`

#### 다른 날짜 카드 (`isToday: false`)
- 접힌 상태: `content`의 첫 줄만 표시 + 날짜 (`text-xs text-gray-400`)
- 펼쳐진 상태: 전체 내용 + 복사·삭제 버튼 (업로드완료 버튼 제외)
- 탭/클릭으로 펼침 토글

#### 업로드 상태 배지
- `is_uploaded: false`: 주황 점 + "미업로드" 텍스트 (`text-orange-500 text-xs`)
- `is_uploaded: true`: 초록 점 + "업로드완료" 텍스트 (`text-green-500 text-xs`)

### `app/api/posts/[id]/route.ts`

`PATCH`와 `DELETE` Route Handler.

```typescript
// 시그니처 수준 가이드
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // 1. 인증 확인 (미인증 시 401)
  // 2. posts 테이블에서 id + user_id 일치 여부 확인 (본인 게시글인지)
  // 3. is_uploaded: true 로 UPDATE
  // 4. 성공 시 200 + { ok: true }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // 1. 인증 확인 (미인증 시 401)
  // 2. posts 테이블에서 id + user_id 일치 여부 확인
  // 3. DELETE
  // 4. 성공 시 200 + { ok: true }
}
```

### `components/DashboardClient.tsx` 수정

Step 1에서 구현한 `DashboardClient`에 posts 로컬 상태와 콜백을 추가한다.

```typescript
// 추가할 로컬 상태
const [localPosts, setLocalPosts] = useState<PostRow[]>(posts)

// onUploaded 콜백: 해당 post의 is_uploaded를 true로 업데이트
const handleUploaded = (postId: string) => {
  setLocalPosts(prev =>
    prev.map(p => p.id === postId ? { ...p, is_uploaded: true } : p)
  )
}

// onDeleted 콜백: 해당 post를 목록에서 제거
const handleDeleted = (postId: string) => {
  setLocalPosts(prev => prev.filter(p => p.id !== postId))
}
```

- `WeekTab`에 `localPosts`를 전달 (점 색상이 실시간 반영됨)
- 선택 날짜의 posts를 `PostCard` 목록으로 렌더링

## Acceptance Criteria

```bash
npm run build
npx tsc --noEmit
```

두 커맨드 모두 에러 없이 통과해야 한다.

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트를 확인한다:
   - `app/api/posts/[id]/route.ts`에서 `user_id` 일치 여부를 반드시 확인하는가? (타인 게시글 수정/삭제 방지)
   - `PostCard`의 클립보드 복사가 `navigator.clipboard.writeText`를 사용하는가?
   - 업로드완료 후 페이지 새로고침 없이 로컬 상태로 즉시 반영되는가? (`onUploaded` 콜백)
   - 삭제 전 confirm 다이얼로그가 있는가?
   - CLAUDE.md CRITICAL 규칙 — DB 쓰기 로직이 Route Handler에서만 처리되는가?
3. 결과에 따라 `phases/5-dashboard/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "components/PostCard.tsx(오늘/다른날 구분, 복사/업로드완료/삭제 버튼, 배지), app/api/posts/[id]/route.ts(PATCH is_uploaded, DELETE, user_id 검증), DashboardClient 로컬 상태 갱신 구현 완료. Phase 5 전체 완료."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `app/api/posts/[id]/route.ts`에서 `user_id` 검증 없이 id만으로 UPDATE/DELETE 금지. 이유: 검증 없이 처리하면 타인의 게시글을 수정·삭제할 수 있는 보안 취약점이 생긴다.
- 업로드완료·삭제 후 `router.refresh()` 또는 전체 페이지 새로고침 금지. 이유: 로컬 상태(`localPosts`)를 콜백으로 갱신해 서버 요청 없이 즉각 반영한다. 새로고침은 UX를 저해한다.
- `PostCard`에서 직접 Supabase 클라이언트로 DB 쓰기 금지. 이유: CLAUDE.md CRITICAL 규칙 — 모든 DB 쓰기는 API Route에서만 처리한다.
- `window.confirm` 없이 삭제 즉시 실행 금지. 이유: 실수로 게시글을 삭제하면 복구할 수 없다.
