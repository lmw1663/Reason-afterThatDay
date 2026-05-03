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

-- 운영 메모:
--  app.supabase_url과 app.supabase_service_role_key는 Supabase Dashboard의
--  Settings > Database > Custom config에서 설정 필요.
--  설정 안 됐으면 cron job이 실패하므로 배포 전 반드시 확인.
