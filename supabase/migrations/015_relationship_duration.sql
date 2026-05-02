-- 015_relationship_duration.sql
-- 연애 기간 범위 컬럼 추가 — 메시지 맥락화 및 자기 성찰 트랙 활용

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS relationship_duration_range TEXT
    CHECK (
      relationship_duration_range IN ('under_1y', '1_to_3y', '3_to_5y', 'over_5y', 'skip')
      OR relationship_duration_range IS NULL
    );

COMMENT ON COLUMN public.users.relationship_duration_range IS
  'Kübler-Ross 회복 작업 깊이 분기용 — under_1y | 1_to_3y | 3_to_5y | over_5y | skip';
