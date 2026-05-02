-- 010_pros_cons_timeline.sql
-- relationship_profile에 시점별 장단점 JSONB 추가 (로시 회상 방지)
-- 기존 pros[], cons[] 유지 (하위 호환)

ALTER TABLE public.relationship_profile
  ADD COLUMN IF NOT EXISTS pros_by_date JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS cons_by_date JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.relationship_profile.pros_by_date IS
  '{ "D+5": ["장점1", ...], "D+20": [...] } — 시점별 장점 누적 (로시 회상 분리)';
COMMENT ON COLUMN public.relationship_profile.cons_by_date IS
  '{ "D+15": ["단점1", ...] } — 시점별 단점 누적 (D+15 이후 주로 수집)';
