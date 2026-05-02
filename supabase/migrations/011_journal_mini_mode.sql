-- ============================================================
-- Migration 011 — 일기 미니 모드 플래그
-- ============================================================
-- 무기력 단계(D+1~7) 사용자의 진입 장벽 낮추기.
-- "오늘은 감정 온도만" 옵션을 위해 journal_entries에 is_mini_mode 컬럼 추가.
-- 기존 journal_entries RLS 정책을 그대로 상속하므로 별도 정책 불필요.

ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS is_mini_mode BOOLEAN NOT NULL DEFAULT false;
