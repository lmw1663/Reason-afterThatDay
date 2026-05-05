-- 031_users_breakup_nullable.sql
-- 온보딩 흐름 수정: consent → login → breakup_date 순서라 동의 저장 시점에는
-- breakup_date가 아직 NULL이어야 정합. 001 초기 스키마의 NOT NULL이 동의
-- upsert를 막아 "null value in column \"breakup_date\" violates not-null constraint"
-- 에러 발생. 본 마이그레이션은 NOT NULL을 푼다.
--
-- 대신 *애플리케이션 레이어*에서 가드:
--  · onboarding-completed=true 게이트는 breakup_date != null + consent_versions 둘 다 충족해야
--  · /onboarding/index.tsx에서 breakup_date 입력을 강제 → 입력 후에야 메인 라우트 진입
--
-- 정합성: breakup_date NULL인 user는 *온보딩 미완 상태*로만 존재. 메인 흐름에서는
-- useUserStore가 breakupDate=null이면 onboarding으로 redirect하므로 안전.

alter table public.users
  alter column breakup_date drop not null;

comment on column public.users.breakup_date is
  '이별 일자. 온보딩 단계에서는 NULL 허용 — consent 저장 시점에는 미입력 상태.';
