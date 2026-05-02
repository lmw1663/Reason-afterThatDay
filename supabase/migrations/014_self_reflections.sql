-- 014_self_reflections.sql
-- 자기 성찰 트랙 (Kristin Neff 자기 연민 + ACT 가치 명료화 + Worden 재배치)

CREATE TABLE public.self_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN (
    'love_self',
    'ideal_match',
    'self_love',
    'strengths',
    'self_care_in_relationship',
    'self_care_alone'
  )),
  score INT CHECK (score IS NULL OR score BETWEEN 1 AND 10),
  labels TEXT[] DEFAULT '{}'::text[],
  text_response TEXT,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'cooling_day5', 'cooling_day6')),
  is_current BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_self_reflections_current
  ON public.self_reflections(user_id, category)
  WHERE is_current = true;

ALTER TABLE public.self_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_reflection" ON public.self_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reflection" ON public.self_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reflection" ON public.self_reflections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
