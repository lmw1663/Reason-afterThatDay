-- 025_processing_suspension.sql
-- X-1-잔여 §37 처리정지권 — PIPA 제37조 대응.
--
-- 사용자가 본인 정보의 *처리를 멈춰달라* 요구할 권리. 본 앱에서 *처리* 대상:
--   1. 알림 발송 (Expo push, AI 응답 푸시 등) — notifications_suspended
--   2. AI 분석/응답 생성 (Edge Function ai-* 호출) — ai_analysis_suspended
--
-- 위기 응답(EmotionalCheckModal·C-SSRS 자동 트리거)은 *안전 보호* 목적이라 본 토글과 무관.
-- 호출처(api/ai 등)는 본 컬럼을 참조해 처리 정지 여부 게이트해야 함 (별도 후속 작업).
--
-- 비파괴 변경 — 기존 행은 default false로 자연 처리 (정지 OFF).

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS notifications_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_analysis_suspended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspension_updated_at TIMESTAMPTZ;
