-- 028_contact_urge.sql
-- D-4 자가 보고 연락 카운터 (검증 §2-8) — 패턴 추적용 1탭 보고.
--
-- 정책:
--  · 1행 = 1탭. urge_count는 *연속 탭* 누적용 reserved (현 UI는 항상 1)
--  · acted_on / context_note는 선택 응답 (현 UI는 미수집, 후속 확장 여지만)
--  · 026 ON DELETE CASCADE 패턴 — 계정 삭제 시 자동 정리
--  · 023은 persona_reclassify_cron이 점유 → 028로 신규 채번
--  · X-1 PIPA 열람권: api/userData.ts USER_TABLES에도 추가 필요

create table public.contact_urges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  reported_at timestamptz not null default now(),
  urge_count smallint not null default 1,
  acted_on boolean,
  context_note text
);

create index contact_urges_user_time on public.contact_urges(user_id, reported_at desc);

alter table public.contact_urges enable row level security;

create policy "users_own_urges_select" on public.contact_urges
  for select using (auth.uid() = user_id);
create policy "users_own_urges_insert" on public.contact_urges
  for insert with check (auth.uid() = user_id);
create policy "users_own_urges_update" on public.contact_urges
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users_own_urges_delete" on public.contact_urges
  for delete using (auth.uid() = user_id);

comment on table public.contact_urges is
  '자가 보고 연락 카운터 (D-4). 1탭 = 1행. 7일 윈도우 추세 시각화에 사용.';
