-- ============================================================
-- Migration 004 — pg_cron 알림 스케줄 설정 (수동 실행 — 개발 환경 전용)
--
-- ⚠️ 운영 환경에선 본 파일 대신 supabase/migrations/042_cron_vault_migration.sql 사용.
--    042는 Vault에서 secret을 읽도록 모든 cron을 재등록하며, 본 파일의 등록 분도 포함한다.
--
-- 본 파일은 *Vault 없이 개발 환경에서 빠르게 동작 확인*하고 싶을 때만 사용한다.
-- 사전 조건:
--   1) pg_cron extension 활성 (Dashboard > Database > Extensions)
--   2) Dashboard SQL Editor에서 GUC 1회 SET:
--        alter database postgres set app.supabase_url = 'https://<project>.supabase.co';
--        alter database postgres set app.supabase_service_role_key = '<service_role_jwt>';
--      (SUPABASE 매니지드 환경에선 권한 거부될 수 있음 — 그 경우 042 Vault 트랙으로)
-- ============================================================

-- pg_cron 확장 활성화 (Supabase 대시보드 > Database > Extensions 에서도 가능)
-- create extension if not exists pg_cron;

-- 매일 21:00 KST (12:00 UTC) 일반 리마인더 푸시
select cron.schedule(
  'push-daily-reminder',
  '0 12 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/push-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 매일 09:00 UTC Day 7 알림 확인 실행
select cron.schedule(
  'push-cooling-day7',
  '0 9 * * *',
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/push-cooling-day7',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
