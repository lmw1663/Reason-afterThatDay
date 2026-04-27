-- ============================================================
-- Migration 001 — 초기 스키마
-- ============================================================

-- users (Supabase Auth uid 기반)
create table public.users (
  id                      uuid references auth.users primary key,
  created_at              timestamptz default now(),
  breakup_date            date not null,
  onboarding_completed    boolean default false,
  graduation_requested_at timestamptz,
  graduation_confirmed_at timestamptz,
  push_token              text
);

-- journal_entries
create table public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users not null,
  created_at  timestamptz default now(),
  mood_score  int check (mood_score between 1 and 10),
  mood_label  text[],
  direction   text check (direction in ('catch', 'let_go', 'undecided')),
  free_text   text,
  ai_response text
);

-- 같은 날 일기 중복 방지 (last-write-wins via upsert)
create unique index journal_entries_user_date_idx
  on public.journal_entries (user_id, date(created_at at time zone 'Asia/Seoul'));

-- question_pool (공유 질문 풀)
create table public.question_pool (
  id              text primary key,
  text            text not null,
  context         text[] not null,  -- ['journal', 'analysis', 'compass', 'graduation']
  is_active       boolean default true,
  weight          int default 1,
  created_at      timestamptz default now()
);

-- question_responses — (user_id, question_id) unique 강제
create table public.question_responses (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.users not null,
  question_id     text references public.question_pool not null,
  response_type   text not null,
  response_value  jsonb not null,
  question_status text default 'answered'
    check (question_status in ('shown', 'answered', 'stale', 're_ask')),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, question_id)
);

-- relationship_profile
create table public.relationship_profile (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users not null unique,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  reasons     text[],
  pros        text[],
  cons        text[],
  fix         int default 0 check (fix between 0 and 10),
  other       int default 0 check (other between 0 and 10),
  role        int default 0 check (role between 0 and 10)
);

-- decision_history
create table public.decision_history (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.users not null,
  created_at  timestamptz default now(),
  direction   text check (direction in ('catch', 'let_go', 'undecided')),
  verdict     text,
  diff_score  int
);

-- graduation_cooling
create table public.graduation_cooling (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.users not null,
  requested_at        timestamptz default now(),
  cooling_ends_at     timestamptz,
  status              text default 'cooling' check (status in ('cooling', 'confirmed', 'cancelled')),
  checkin_responses   jsonb default '[]',
  notifications_sent  int default 0
);
