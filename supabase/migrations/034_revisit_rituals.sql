-- 034_revisit_rituals.sql
-- 매듭 트랙(F-1) — knot_revisit_schedule: 매듭 후 회상 의식 푸시 스케줄
-- 스펙: docs/psychology-logic/redesign-graduation.md §5-1, §6
--
-- 페르소나별 회상 의식:
--   P05 본인이 끝낸 죄책감: D+30, D+60 재방문 회상
--   P14 외도 가해 후회: D+30, D+60 재방문 회상 (자기 용서 D+60 잠금 해제 신호)
--   P06 반복 재회 사이클: D+7 사이클 회고 (지난번엔 어땠어?)

CREATE TABLE IF NOT EXISTS public.knot_revisit_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  ritual_type TEXT NOT NULL CHECK (ritual_type IN ('d30_revisit', 'd60_revisit', 'd30_cycle_review')),
  triggered_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knot_revisit_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_revisit" ON public.knot_revisit_schedule
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_revisit" ON public.knot_revisit_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_revisit" ON public.knot_revisit_schedule
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
-- DELETE 미허용 — 발화 이력은 보존

-- 푸시 스케줄러가 효율적으로 미발화 항목 조회
CREATE INDEX IF NOT EXISTS knot_revisit_pending_idx
  ON public.knot_revisit_schedule(scheduled_at)
  WHERE triggered_at IS NULL;

CREATE INDEX IF NOT EXISTS knot_revisit_user_idx
  ON public.knot_revisit_schedule(user_id, scheduled_at DESC);

COMMENT ON TABLE public.knot_revisit_schedule IS
  '매듭 완료 후 페르소나별 회상 의식 푸시 스케줄 (P05·P14 D+30/60, P06 D+7 사이클 회고).';
COMMENT ON COLUMN public.knot_revisit_schedule.ritual_type IS
  'd30_revisit: 매듭 D+30 회상 / d60_revisit: 매듭 D+60 회상 / d30_cycle_review: P06 사이클 회고 (D+7).';
COMMENT ON COLUMN public.knot_revisit_schedule.triggered_at IS
  '푸시 발화 시각. NULL이면 미발화.';
COMMENT ON COLUMN public.knot_revisit_schedule.completed_at IS
  '사용자가 회상 의식 화면을 완료한 시각. NULL이면 미완료.';
