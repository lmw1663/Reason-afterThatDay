-- 023_persona_reclassify_cron.sql
-- 페르소나 재분류 cron 등록 — C-1-4
--
-- 매일 0시(서울 = UTC+9) 실행. supabase/functions/persona-reclassify-cron 호출.
-- D+7/14/30/60/90 해당자 axes 시계열 갱신 (분류 자체는 클라이언트 위임 — onboarding_responses
-- 테이블 신설 후 서버 분류 활성화 예정).
--
-- 사전 조건: pg_cron extension + supabase_anon_role 권한
-- 배포: supabase db push 후 Supabase Dashboard에서 cron 활성 확인.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 한국 시간(UTC+9) 기준 0시 = UTC 15시
select cron.schedule(
  'persona-reclassify-daily',
  '0 15 * * *',  -- UTC 15:00 = KST 0:00
  $$
  select net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/persona-reclassify-cron',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 운영 메모 (출시 전 필수):
--
--  현재 본 SQL은 current_setting('app.*')로 평문 변수를 읽음. 개발 단계엔 동작하지만
--  출시 운영 환경에선 service_role_key를 평문 GUC에 두는 것은 보안상 부적절.
--
--  **출시 전 마이그레이션 작성 필요**: 024_persona_reclassify_cron_vault.sql
--    1. Supabase Vault에 secrets 등록:
--         select vault.create_secret('https://xxxx.supabase.co', 'project_url');
--         select vault.create_secret('eyJhbG...', 'service_role_key');
--    2. 본 cron job을 unschedule 후 vault 호출 버전으로 재등록:
--         select cron.unschedule('persona-reclassify-daily');
--         select cron.schedule('persona-reclassify-daily', '0 15 * * *', $$
--           select net.http_post(
--             url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
--                    || '/functions/v1/persona-reclassify-cron',
--             headers := jsonb_build_object(
--               'Content-Type', 'application/json',
--               'Authorization', 'Bearer ' ||
--                 (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
--             ),
--             body := '{}'::jsonb
--           );
--         $$);
--
--  ⚠️ 주의: 환경에 따라 ALTER DATABASE SET app.* 호출이 permission denied될 수 있음.
--   Supabase 매니지드 환경에선 GUC 설정 권한 제한적이라, **Vault 사용이 사실상 정도**.
--   본 023은 *개발 환경 동작 확인용*, 운영은 024(Vault) 필수.
