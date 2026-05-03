-- 017_memory_log.sql
-- 추억 정리 트랙 재설계 — "완료 체크" 방식을 버리고 자유 입력 일기형으로.
-- 사용자가 떠오른 추억을 항목 단위로 기록하고 모아 볼 수 있게 함.
-- 카테고리(사진/메시지/장소/기타)는 선택 — null 허용.

CREATE TABLE public.memory_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category TEXT CHECK (category IS NULL OR category IN ('photo', 'message', 'place', 'other')),
  content TEXT NOT NULL CHECK (length(content) > 0 AND length(content) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_log_user_created
  ON public.memory_log(user_id, created_at DESC);

ALTER TABLE public.memory_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_memory_log" ON public.memory_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "insert_own_memory_log" ON public.memory_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_memory_log" ON public.memory_log
  FOR DELETE USING (auth.uid() = user_id);

-- 기존 memory_organization 테이블은 호환을 위해 남겨두지만, 앱은 더 이상 쓰지 않음.
-- 데이터 마이그레이션이 필요하면 추후 별도 작업.
