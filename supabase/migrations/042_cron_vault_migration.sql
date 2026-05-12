-- 042_cron_vault_migration.sql
-- 출시 운영용 — pg_cron 작업의 인증 정보를 평문 GUC → Supabase Vault로 전환
--
-- 배경:
--   023(persona-reclassify-daily), 035(knot-revisit-daily) 및
--   004_pg_cron_setup_manual(push-daily-reminder, push-cooling-day7)은
--   current_setting('app.supabase_url'), current_setting('app.supabase_service_role_key')
--   로 평문 GUC를 읽어 Edge Function을 호출한다.
--
--   Supabase 매니지드 환경에선 ALTER DATABASE SET app.* 권한이 제한적이며,
--   service_role_key를 평문 GUC에 두는 것 자체가 보안 약점이다.
--   본 마이그레이션은 vault.decrypted_secrets에서 값을 읽도록 모든 cron을 재등록한다.
--
-- 사전 조건 (사용자가 Supabase Dashboard에서 1회 수행):
--   SQL Editor에서:
--     select vault.create_secret('https://<project>.supabase.co', 'project_url');
--     select vault.create_secret('<service_role_key_jwt>', 'service_role_key');
--
--   이미 등록돼 있으면:
--     update vault.secrets set secret = '<new_value>' where name = 'project_url';
--     update vault.secrets set secret = '<new_value>' where name = 'service_role_key';
--
-- 본 마이그레이션은 secret 등록 *후* 적용해야 한다.
-- secret이 없으면 cron 등록은 성공하나 실행 시 NULL URL/Authorization으로 fail.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 기존 cron 작업을 안전하게 제거 — 미등록 상태에서도 에러 없이 통과
do $$
declare
  job_name text;
begin
  foreach job_name in array array[
    'persona-reclassify-daily',
    'knot-revisit-daily',
    'push-daily-reminder',
    'push-cooling-day7'
  ]
  loop
    if exists (select 1 from cron.job where jobname = job_name) then
      perform cron.unschedule(job_name);
    end if;
  end loop;
end $$;

-- 페르소나 재분류 (023) — UTC 15:00 = KST 0시
select cron.schedule(
  'persona-reclassify-daily',
  '0 15 * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/persona-reclassify-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 매듭 회상 의식 (035) — UTC 15:00 = KST 0시
select cron.schedule(
  'knot-revisit-daily',
  '0 15 * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/knot-revisit-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 일반 리마인더 푸시 (004) — UTC 12:00 = KST 21시
select cron.schedule(
  'push-daily-reminder',
  '0 12 * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/push-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 매듭 유예 Day 7 알림 (004) — UTC 09:00 = KST 18시
select cron.schedule(
  'push-cooling-day7',
  '0 9 * * *',
  $cron$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
           || '/functions/v1/push-cooling-day7',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

comment on extension pg_cron is
  'Cron jobs (042): persona-reclassify-daily, knot-revisit-daily, push-daily-reminder, push-cooling-day7. Secrets via vault.';

-- 운영 점검 쿼리 (수동 실행):
--   select jobname, schedule, active from cron.job order by jobname;
--   select * from vault.decrypted_secrets where name in ('project_url','service_role_key');
