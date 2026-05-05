# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성 최소화. 작동하는 최소 구현을 선택한다.
보안은 타협하지 않는다 — 플랜 제한·인증·결제는 서버에서 강제한다.

---

### ADR-001: Supabase 선택 (DB + Auth)
**결정**: PostgreSQL DB, Auth, RLS를 Supabase 하나로 통합
**이유**: Next.js SSR과 궁합이 좋고, RLS로 DB 레벨 보안을 선언적으로 관리할 수 있다. Auth도 내장되어 Kakao OAuth 연동이 간단하다.
**트레이드오프**: Supabase 플랫폼에 종속됨. 트래픽 급증 시 비용 예측이 어려울 수 있음.

#### Supabase 테이블 스키마
```
users
- id (uuid, PK)          ← Supabase Auth user id와 동일
- kakao_id (text)
- plan ('free' | 'pro')
- industry (text)
- tone (text)
- emoji_level (text)
- hashtag_enabled (bool)
- created_at (timestamptz)

posts
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- content (text)
- topic (text)
- is_uploaded (bool)
- is_favorited (bool)
- created_at (timestamptz)

subscriptions
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- status ('active' | 'expired' | 'cancelled')
- started_at (timestamptz)
- expires_at (timestamptz)
```

---

### ADR-002: 플랜 보안 3중 체크 구조
**결정**: 클라이언트 UX 체크 → API Route 서버 체크 → Supabase RLS DB 차단
**이유**: 클라이언트 코드는 항상 우회 가능하다. DB 레벨까지 막지 않으면 플랜 제한이 무의미하다.
**트레이드오프**: 로직 중복. 단, 각 레이어의 역할이 다름 (UX / 서버 응답 / DB 무결성).

```
사용자 액션
→ 1차: usePlan.ts 클라이언트 체크 (UX용 — 즉각적 피드백)
→ 2차: API Route에서 플랜 재확인 (서버 차단)
→ 3차: Supabase RLS에서 DB 레벨 차단 (최종 방어선)
```

#### RLS 정책
- `posts` 테이블
  - 무료 플랜: 7일 이내 데이터만 SELECT 허용
  - 무료 플랜: 하루 1개 초과 INSERT 차단
  - 프로 플랜: 제한 없음
- `users` 테이블
  - 본인 데이터만 SELECT/UPDATE 허용
  - `plan` 컬럼은 서버(Service Role)에서만 UPDATE 허용

#### API Route 플랜 체크 필수 항목
- 글 생성 API: 하루 생성 횟수 초과 여부 확인
- 보관함 API: 7일 이후 데이터 접근 차단
- 자동 생성 API: 프로 플랜 여부 확인
- AI 보완 API: 하루 10회 초과 여부 확인

---

### ADR-003: 카카오 로그인 선택
**결정**: 소셜 로그인을 카카오 단일 제공자로 제한 (Google/Apple 미지원)
**이유**: MVP 타겟인 국내 자영업자의 카카오 계정 보유율이 매우 높다. 로그인 선택지가 많으면 결정 피로가 생기고 전환율이 낮아진다.
**트레이드오프**: 카카오 계정이 없는 사용자는 가입 불가. 향후 필요 시 Google 추가.

#### 카카오 로그인 사전 준비
- 카카오 개발자 콘솔 앱 등록 필요 (https://developers.kakao.com)
- Redirect URI 등록:
  - 개발: `http://localhost:3000/auth/callback`
  - 운영: `https://dopost.vercel.app/auth/callback`
- 배포 전 카카오 로그인 검수 신청 필수 (심사 1~3 영업일)

---

### ADR-004: 결제 — 토스페이먼츠 선택
**결정**: 구독 결제를 토스페이먼츠로 구현 (Phase 11)
**이유**: 국내 서비스 최적화, 문서화가 잘 되어 있고 Next.js 연동 예제가 충분하다.
**트레이드오프**: 해외 카드 결제 지원 제한.

#### 결제 구현 주의사항
- 결제 완료 후 Webhook으로 plan 업데이트 처리 (클라이언트에서 직접 변경 금지)
- 결제 실패 / 중복 결제 예외 처리 필수
- 구독 만료 시 플랜 자동 다운그레이드 (Supabase Edge Functions)
