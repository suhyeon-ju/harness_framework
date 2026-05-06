-- ============================================================
-- doPOST Initial Schema
-- Supabase SQL Editor에 붙여넣고 실행하세요.
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. TABLES
-- ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id                uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  kakao_id          text,
  plan              text        NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  industry          text        NOT NULL DEFAULT '',
  tone              text        NOT NULL DEFAULT 'friendly',
  emoji_level       text        NOT NULL DEFAULT 'moderate',
  hashtag_enabled   boolean     NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content      text        NOT NULL DEFAULT '',
  topic        text        NOT NULL DEFAULT '',
  is_uploaded  boolean     NOT NULL DEFAULT false,
  is_favorited boolean     NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     text        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- ──────────────────────────────────────────────
-- 2. INDEXES
-- ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS posts_user_id_created_at_idx ON public.posts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);

-- ──────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- ──────────────────────────────────────────────
-- 4. users RLS POLICIES
-- ──────────────────────────────────────────────

-- 본인 행만 조회 가능
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 본인 행만 수정 가능
CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 온보딩 시 최초 삽입 허용 (auth.uid와 id 일치)
CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- plan 컬럼은 authenticated 유저가 직접 변경 불가 (서버 Service Role만 가능)
-- service_role은 RLS를 우회하므로 별도 정책 불필요
REVOKE UPDATE (plan) ON public.users FROM authenticated;

-- ──────────────────────────────────────────────
-- 5. posts RLS POLICIES
-- ──────────────────────────────────────────────

-- 조회: 본인 게시글만, 무료 플랜은 7일 이내만
CREATE POLICY "posts_select_own" ON public.posts
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      (SELECT plan FROM public.users WHERE id = auth.uid()) = 'pro'
      OR created_at > now() - INTERVAL '7 days'
    )
  );

-- 생성: 본인 user_id + 하루 생성 횟수 초과 시 차단 (KST 기준)
CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      SELECT
        CASE (SELECT plan FROM public.users WHERE id = auth.uid())
          WHEN 'pro'  THEN
            (SELECT COUNT(*) FROM public.posts
             WHERE user_id = auth.uid()
               AND (created_at AT TIME ZONE 'Asia/Seoul')::date
                   = (now() AT TIME ZONE 'Asia/Seoul')::date
            ) < 3
          ELSE
            (SELECT COUNT(*) FROM public.posts
             WHERE user_id = auth.uid()
               AND (created_at AT TIME ZONE 'Asia/Seoul')::date
                   = (now() AT TIME ZONE 'Asia/Seoul')::date
            ) < 1
        END
    )
  );

-- 수정: 본인 게시글만 (is_uploaded, is_favorited 업데이트용)
CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 삭제: 본인 게시글만
CREATE POLICY "posts_delete_own" ON public.posts
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 6. subscriptions RLS POLICIES
-- ──────────────────────────────────────────────

-- 본인 구독 정보만 조회 가능 (쓰기는 service_role만)
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 완료! 위 SQL을 모두 실행한 뒤 Supabase Authentication > Providers에서
-- Kakao 프로바이더를 활성화하세요.
-- ──────────────────────────────────────────────
