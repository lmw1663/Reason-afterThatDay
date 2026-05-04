-- 029_raw_mode.sql
-- D-5 P10 분노 모드 + 2차 정서 강제 (구현계획 §3-5).
--
-- 정책:
--  · is_raw_mode=true는 *분노 표출* 일기. 종료 *전* 강제 2차 정서 카드 1개 선택 필요
--  · secondary_emotion: 슬픔·두려움·상처·수치·무력감 중 1 (free text 허용)
--  · 1일 진입 횟수 ≤ 2 — 별도 카운터 없이 journal_entries 행 카운트로 검증 (RLS·CASCADE 정합)
--  · 024는 about_me_categories_g5b가 점유 → 029로 채번
--  · 임상 근거: 분노 venting 단독은 복수 회상·반추 강화 (Bushman 2002). 2차 정서 통합으로 감정
--    소화 경로 유도

alter table public.journal_entries
  add column if not exists is_raw_mode boolean not null default false,
  add column if not exists secondary_emotion text;

create index if not exists journal_entries_user_raw_time
  on public.journal_entries(user_id, created_at desc)
  where is_raw_mode = true;

comment on column public.journal_entries.is_raw_mode is
  'P10 분노 표출 모드 (D-5). true면 secondary_emotion 필수.';
comment on column public.journal_entries.secondary_emotion is
  '분노 아래 2차 정서 (D-5). raw mode 종료 전 강제 선택.';
