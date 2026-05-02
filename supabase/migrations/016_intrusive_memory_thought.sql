-- 016_intrusive_memory_thought.sql
-- 떠오름 기록에 어떤 생각이었는지 텍스트 추가

ALTER TABLE public.intrusive_memory_response
  ADD COLUMN IF NOT EXISTS thought_text TEXT;

COMMENT ON COLUMN public.intrusive_memory_response.thought_text IS
  '어떤 생각/기억이 떠올랐는지 사용자 입력 (선택사항)';
