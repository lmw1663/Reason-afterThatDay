-- 006_emotion_physical_signals.sql
-- journal_entries에 physical_signals 컬럼 추가
-- mood_label TEXT[]는 001에서 이미 존재 — 기존 컬럼 활용 (신규 추가 X)

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS physical_signals TEXT[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.journal_entries.physical_signals IS
  'DBT 신체 신호 배열 — sleep_disturbance | appetite_change | dazed | frequent_crying';
