-- 035_knot_revisit_cron.sql
-- F-9 후속 — 매듭 회상 의식 푸시 cron 등록
--
-- ⚠️ 운영 상태: 본 cron은 042_cron_vault_migration.sql에서 Vault 버전으로 재등록됨.
--    마이그레이션 알파벳 순서상 042가 035 이후 적용되어 최종 정의는 042가 가진다.
--
-- 매일 KST 0시(UTC 15시) 실행 → supabase/functions/knot-revisit-cron 호출.
-- knot_revisit_schedule.scheduled_at <= now() AND triggered_at IS NULL인 row를 푸시 발송.
--
-- 사전 조건: pg_cron + pg_net (023 마이그레이션에서 이미 활성)
-- 출시 운영은 024(Vault) 마이그레이션 작성 후 service_role_key를 vault에서 읽도록 전환 필요
-- (023의 운영 메모와 동일 트레이드오프).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 한국 시간(UTC+9) 기준 0시 = UTC 15시
-- 회상 의식은 D+30/D+60/D+7에 발화되므로 매일 1회만 체크하면 충분
select cron.schedule(
  'knot-revisit-daily',
  '0 15 * * *',  -- UTC 15:00 = KST 0:00
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/knot-revisit-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

comment on extension pg_cron is
  'Used by knot-revisit-daily (035) and persona-reclassify-daily (023) cron jobs.';
