-- 009_intrusive_memory.sql
-- 갑자기 떠오름 처리 응답 저장 테이블 (DBT distress tolerance 트래킹)

CREATE TABLE public.intrusive_memory_response (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  mood_score INT NOT NULL CHECK (mood_score BETWEEN 1 AND 10),
  is_escalated_to_journal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intrusive_memory_response ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_intrusive" ON public.intrusive_memory_response
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_intrusive" ON public.intrusive_memory_response
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_intrusive" ON public.intrusive_memory_response
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_intrusive" ON public.intrusive_memory_response
  FOR DELETE USING (auth.uid() = user_id);
