-- ============================================================
-- Migration 004 — pg_cron 알림 스케줄 설정
-- Supabase 프로젝트에서 pg_cron 확장이 활성화된 후 실행
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
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
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
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
