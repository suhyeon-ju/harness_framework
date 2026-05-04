# Step 2: base-types

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 DB 스키마, 플랜 구성, 도메인 용어를 파악하라:

- `CLAUDE.md`
- `lib/supabase.ts` (Step 1에서 생성)
- `lib/supabase-server.ts` (Step 1에서 생성)

## 작업

Supabase DB 테이블 타입과 앱 도메인 타입을 정의한다.

### `types/database.ts` — DB Row 타입

CLAUDE.md의 Supabase 테이블 설계를 기반으로 Row 타입을 정의한다.

```typescript
// 시그니처 수준 가이드

export interface UserRow {
  id: string
  kakao_id: string
  plan: 'free' | 'pro'
  industry: string
  tone: string
  emoji_level: string
  hashtag_enabled: boolean
  created_at: string
}

export interface PostRow {
  id: string
  user_id: string
  content: string
  topic: string
  is_uploaded: boolean
  is_favorited: boolean
  created_at: string
}

export interface SubscriptionRow {
  id: string
  user_id: string
  status: 'active' | 'expired' | 'cancelled'
  started_at: string
  expires_at: string
}
```

### `types/index.ts` — 앱 도메인 타입

플랜, 업종, 말투, 이모지 레벨을 타입으로 정의한다. CLAUDE.md의 설정 페이지 옵션 값과 정확히 일치시킨다.

```typescript
// 시그니처 수준 가이드

export type Plan = 'free' | 'pro'

export type Industry = 'cafe' | 'restaurant' | 'realestate' | 'hairsalon' | 'custom'

export type Tone = 'casual' | 'formal' | 'friendly' | 'informative' | 'empathetic'

export type EmojiLevel = 'heavy' | 'moderate' | 'none'

// 사용자 생성 횟수 제한 상수
export const PLAN_LIMITS = {
  free: { dailyPosts: 1, archiveDays: 7, aiEnhance: 0 },
  pro: { dailyPosts: 3, archiveDays: Infinity, aiEnhance: 10 },
} as const
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
   - `types/` 폴더에만 타입이 정의되어 있는가?
   - `Industry`, `Tone`, `EmojiLevel` 값이 CLAUDE.md 설정 페이지 옵션과 일치하는가?
   - `PLAN_LIMITS` 상수의 수치가 CLAUDE.md 플랜 비교표와 일치하는가?
3. 결과에 따라 `phases/1-project-setup/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "types/database.ts(UserRow/PostRow/SubscriptionRow), types/index.ts(Plan/Industry/Tone/EmojiLevel/PLAN_LIMITS) 생성 완료. Phase 1 전체 완료."`
   - 수정 3회 시도 후에도 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 사용자 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"` 후 즉시 중단

## 금지사항

- `types/` 외부 파일(예: `lib/supabase.ts`)에 도메인 타입 정의 금지. 이유: CLAUDE.md 아키텍처 규칙상 타입은 `types/` 폴더에만 둔다.
- `any` 타입 사용 금지. 이유: TypeScript strict mode 프로젝트이며, `any`는 타입 안전성을 무력화한다.
- DB Row 타입에 optional(`?`) 필드 임의 추가 금지. 이유: CLAUDE.md 스키마와 다른 구조를 만들면 이후 Supabase 쿼리 타입 불일치가 발생한다.
