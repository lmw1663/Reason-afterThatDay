-- 033_relationship_cycle.sql
-- 매듭 트랙(F-1) — relationship_profile cycle 추적 + knot_archive 테이블
-- 스펙: docs/psychology-logic/redesign-graduation.md §5-1

-- relationship_profile에 cycle 카운터·마지막 매듭 메타 추가
ALTER TABLE public.relationship_profile
  ADD COLUMN IF NOT EXISTS cycle_count INT NOT NULL DEFAULT 1
    CHECK (cycle_count >= 1),
  ADD COLUMN IF NOT EXISTS last_knot_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_knot_label TEXT
    CHECK (last_knot_label IS NULL OR last_knot_label IN ('매듭', '마무리', '단절 30일 달성'));

COMMENT ON COLUMN public.relationship_profile.cycle_count IS
  '같은 관계에 대한 매듭 사이클 누적 (1부터). 가역성(H1) — 새 사이클 시작 시 증가.';
COMMENT ON COLUMN public.relationship_profile.last_knot_at IS
  '가장 최근 매듭 완료 시각. NULL이면 아직 매듭 경험 없음.';
COMMENT ON COLUMN public.relationship_profile.last_knot_label IS
  '가장 최근 매듭에서 사용된 라벨 (페르소나에 따라 다를 수 있음).';

-- knot_archive: 사이클별 스냅샷 보존 (H1 가역성 — 이전 사이클 데이터 보존하되 노출은 view에서)
CREATE TABLE IF NOT EXISTS public.knot_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  cycle_index INT NOT NULL CHECK (cycle_index >= 1),
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  knot_label TEXT NOT NULL CHECK (knot_label IN ('매듭', '마무리', '단절 30일 달성')),
  -- 사이클 종료 시점 통계 스냅샷 (일기 수·평균 mood·사용 페르소나·cooling_days 등)
  summary JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.knot_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_archive" ON public.knot_archive
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_archive" ON public.knot_archive
  FOR INSERT WITH CHECK (auth.uid() = user_id);
-- UPDATE/DELETE 정책 없음 — 보존된 사이클 스냅샷은 수정·삭제 불가 (graduation_farewell과 동일 정책)

CREATE INDEX IF NOT EXISTS knot_archive_user_cycle_idx
  ON public.knot_archive(user_id, cycle_index DESC);

COMMENT ON TABLE public.knot_archive IS
  '매듭 사이클 종료 시 스냅샷. 사용자 [기록] 탭에서 사이클 타임라인으로 노출. INSERT·SELECT만 허용.';
