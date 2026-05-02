-- 008_cooling_reflections.sql
-- Day 5/6 의미 재구성·미래 계획 저장 테이블 (Worden 4과제)

CREATE TABLE public.cooling_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  day INT NOT NULL CHECK (day BETWEEN 5 AND 6),
  reflection_type TEXT NOT NULL CHECK (reflection_type IN ('learning', 'future_plan')),
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cooling_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_reflections" ON public.cooling_reflections
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_reflections" ON public.cooling_reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_reflections" ON public.cooling_reflections
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_reflections" ON public.cooling_reflections
  FOR DELETE USING (auth.uid() = user_id);
