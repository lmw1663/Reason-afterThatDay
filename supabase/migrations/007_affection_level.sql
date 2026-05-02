-- 007_affection_level.sql
-- journal_entries에 원망↔애정 수평축 수치 추가 (Bowlby 양가감정 측정)

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS affection_level INT
    CHECK (affection_level IS NULL OR affection_level BETWEEN 0 AND 10);

COMMENT ON COLUMN public.journal_entries.affection_level IS
  '원망↔애정 수평축: 0=완전히 미워 ~ 10=여전히 좋아 (NULL=입력 안 함)';
