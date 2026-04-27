-- ============================================================
-- Migration 002 — RLS 정책 + updated_at 트리거
-- ============================================================

-- cooling_ends_at 자동 설정 (generated column 대체)
create or replace function set_cooling_ends_at()
returns trigger language plpgsql as $$
begin
  if new.cooling_ends_at is null then
    new.cooling_ends_at = new.requested_at + interval '7 days';
  end if;
  return new;
end;
$$;

create trigger graduation_cooling_ends_at
  before insert on public.graduation_cooling
  for each row execute function set_cooling_ends_at();

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- question_responses updated_at 트리거
create trigger question_responses_updated_at
  before update on public.question_responses
  for each row execute function update_updated_at();

-- relationship_profile updated_at 트리거
create trigger relationship_profile_updated_at
  before update on public.relationship_profile
  for each row execute function update_updated_at();

-- ============================================================
-- RLS 활성화 (USING + WITH CHECK — INSERT/UPDATE 타 유저 주입 방지)
-- ============================================================

alter table public.users enable row level security;
create policy "users_own_profile" on public.users
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

alter table public.journal_entries enable row level security;
create policy "users_own_journals" on public.journal_entries
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.question_responses enable row level security;
create policy "users_own_responses" on public.question_responses
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.relationship_profile enable row level security;
create policy "users_own_rel_profile" on public.relationship_profile
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.decision_history enable row level security;
create policy "users_own_decisions" on public.decision_history
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table public.graduation_cooling enable row level security;
create policy "users_own_cooling" on public.graduation_cooling
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- question_pool: 모두 읽기 가능, 쓰기는 service_role만
alter table public.question_pool enable row level security;
create policy "anyone_can_read_pool" on public.question_pool
  for select using (true);
