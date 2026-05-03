-- 026_cascade_fk_for_account_delete.sql
-- X-1-잔여 계정 삭제 — 001 마이그레이션 시점 FK들이 CASCADE 누락이라 auth.admin.deleteUser 호출 시
-- public.users 행이 고아로 남거나 FK violation으로 실패. 본 마이그레이션이 ON DELETE CASCADE를
-- 명시적으로 재선언해 PIPA §36 완전 처리(계정 삭제 → 자식 모두 자동 삭제) 보장.
--
-- 008·012·013·014·017·020·022 마이그레이션은 이미 CASCADE 명시 — 본 패치 불필요.
-- 본 패치는 001-era 6건만 대상.

-- 1) public.users.id → auth.users — 핵심. CASCADE 없으면 auth.admin.deleteUser가 FK violation.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users
  ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) journal_entries.user_id → public.users
ALTER TABLE public.journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_fkey;
ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3) question_responses.user_id → public.users
ALTER TABLE public.question_responses DROP CONSTRAINT IF EXISTS question_responses_user_id_fkey;
ALTER TABLE public.question_responses
  ADD CONSTRAINT question_responses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4) relationship_profile.user_id → public.users
ALTER TABLE public.relationship_profile DROP CONSTRAINT IF EXISTS relationship_profile_user_id_fkey;
ALTER TABLE public.relationship_profile
  ADD CONSTRAINT relationship_profile_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 5) decision_history.user_id → public.users
ALTER TABLE public.decision_history DROP CONSTRAINT IF EXISTS decision_history_user_id_fkey;
ALTER TABLE public.decision_history
  ADD CONSTRAINT decision_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 6) graduation_cooling.user_id → public.users
ALTER TABLE public.graduation_cooling DROP CONSTRAINT IF EXISTS graduation_cooling_user_id_fkey;
ALTER TABLE public.graduation_cooling
  ADD CONSTRAINT graduation_cooling_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
