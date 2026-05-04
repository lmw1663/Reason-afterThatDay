-- 030_assessments.sql
-- D-1 검사 응답 저장 인프라 (구현계획 §3-1).
--
-- 정책:
--  · PHQ-9 / GAD-7 / RSE 등 자유-라이선스 척도 응답 저장 (라이선스 정리: docs/legal/scales-license.md)
--  · raw_score / band은 *내부 데이터* — UI 노출 시 메타포 매핑 필수 (검증 §2-7)
--  · 022는 persona_profiling이 점유 → 030으로 채번
--  · 026 ON DELETE CASCADE 패턴 (계정 삭제 시 자동 정리)
--  · X-1 PIPA 열람권: api/userData.ts USER_TABLES에도 추가
--  · CSSRS는 별도 crisis_assessments(020) 사용 — 본 테이블 instrument enum에는 정의만,
--    실제 사용은 PHQ9/GAD7/RSE 위주 (PHQ2/GAD2 단축형은 위기 모달 통합 시 사용)

create table public.psych_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  assessed_at timestamptz not null default now(),
  source text not null,
  instrument text not null check (instrument in ('PHQ2','PHQ9','GAD2','GAD7','RSE','RRS10','ECRR12','PG13','CSSRS')),
  responses jsonb not null,
  raw_score smallint,
  band text
);

create index psych_assessments_user_time on public.psych_assessments(user_id, assessed_at desc);
create index psych_assessments_user_instrument_time
  on public.psych_assessments(user_id, instrument, assessed_at desc);

alter table public.psych_assessments enable row level security;

create policy "users_own_assessments_select" on public.psych_assessments
  for select using (auth.uid() = user_id);
create policy "users_own_assessments_insert" on public.psych_assessments
  for insert with check (auth.uid() = user_id);
create policy "users_own_assessments_update" on public.psych_assessments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_assessments_delete" on public.psych_assessments
  for delete using (auth.uid() = user_id);

comment on table public.psych_assessments is
  '심리검사 응답 (D-1). raw_score/band은 내부 데이터, UI 노출은 메타포 매핑 필수.';
comment on column public.psych_assessments.source is
  '측정 트리거: onboarding | d7 | d14 | d30 | graduation | manual';
