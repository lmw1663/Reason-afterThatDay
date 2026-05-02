-- 012_graduation_farewell.sql
-- 졸업 작별 문장 + AI 응답 저장 (의식적 마무리 행위 보존)
-- UPDATE/DELETE 정책 의도적으로 생성하지 않음 — 한번 쓴 작별은 수정·삭제 불가

CREATE TABLE public.graduation_farewell (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cooling_period_id UUID NOT NULL REFERENCES public.graduation_cooling(id) ON DELETE CASCADE,
  user_message TEXT NOT NULL CHECK (char_length(user_message) <= 80),
  ai_response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.graduation_farewell ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_farewell" ON public.graduation_farewell
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_farewell" ON public.graduation_farewell
  FOR INSERT WITH CHECK (auth.uid() = user_id);
