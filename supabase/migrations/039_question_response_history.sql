-- ============================================================
-- Migration 039 — 응답 변화 추적 (previous_value + history archive)
-- ============================================================
-- v2 §4 "답이 바뀌면 변화를 자연스럽게 언급" 인프라.
--
-- 이중 구조:
--   · question_responses.previous_value    — 직전 1개 (UI prefill, "저번엔 X였는데")
--   · question_response_history            — append-only (졸업 letter "처음↔지금" 비교)
--
-- 트리거 분리:
--   · BEFORE UPDATE: previous_value / response_count 갱신 (NEW 수정)
--   · AFTER  IU    : history append — value 변경시에만 (shown 상태 제외)
-- AFTER 로 분리해 부모 INSERT 실패 시 history 고아 row 방지.

alter table public.question_responses
  add column if not exists previous_value jsonb,
  add column if not exists response_count int default 1;

-- ------------------------------------------------------------
-- history 테이블 (append-only)
-- ------------------------------------------------------------
create table if not exists public.question_response_history (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users on delete cascade not null,
  question_id     text references public.question_pool not null,
  response_value  jsonb not null,
  recorded_at     timestamptz default now(),
  source_screen   text,    -- Phase F 에서 명시 주입 — Phase A 는 null 허용
  d_plus          int      -- 기록 시점 D+N (breakup_date 기준 동결값)
);

create index if not exists qrh_user_q_time_idx
  on public.question_response_history (user_id, question_id, recorded_at desc);

create index if not exists qrh_user_recent_idx
  on public.question_response_history (user_id, recorded_at desc);

alter table public.question_response_history enable row level security;

-- Append-only 의도 — SELECT/INSERT 만 허용. UPDATE/DELETE 정책 미부여 = RLS 단 차단.
create policy "users_qrh_select" on public.question_response_history
  for select using (auth.uid() = user_id);
create policy "users_qrh_insert" on public.question_response_history
  for insert with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- BEFORE UPDATE — 값이 바뀌었을 때만 previous_value/response_count 갱신
--   기존 update_updated_at 트리거와 충돌 없음:
--     question_responses_set_prev      < question_responses_updated_at  (alphabetical)
--   둘은 서로 다른 컬럼만 수정.
-- ------------------------------------------------------------
create or replace function set_question_response_previous()
returns trigger language plpgsql as $$
begin
  if (new.response_value is distinct from old.response_value) then
    new.previous_value = old.response_value;
    new.response_count = coalesce(old.response_count, 1) + 1;
  end if;
  return new;
end;
$$;

create trigger question_responses_set_prev
  before update on public.question_responses
  for each row execute function set_question_response_previous();

-- ------------------------------------------------------------
-- AFTER INSERT/UPDATE — history append
--   · question_status='shown' 은 archive 제외 (markQuestionShown 노이즈 컷)
--   · UPDATE 는 값이 실제로 바뀐 경우만
--   · d_plus 는 users.breakup_date 기준 동결 — 사용자가 추후 breakup_date
--     수정해도 과거 기록의 시점은 흔들리지 않음
-- ------------------------------------------------------------
create or replace function archive_question_response()
returns trigger language plpgsql as $$
declare
  v_d_plus int;
begin
  if (new.question_status = 'shown') then
    return null;
  end if;

  if (TG_OP = 'UPDATE' and new.response_value is not distinct from old.response_value) then
    return null;
  end if;

  -- breakup_date 기준 D+N (nullable — 미설정 시 null)
  select case when u.breakup_date is null then null
              else (current_date - u.breakup_date) end
    into v_d_plus
    from public.users u
   where u.id = new.user_id;

  insert into public.question_response_history
    (user_id, question_id, response_value, d_plus)
    values (new.user_id, new.question_id, new.response_value, v_d_plus);

  return null;
end;
$$;

create trigger question_responses_archive
  after insert or update on public.question_responses
  for each row execute function archive_question_response();
