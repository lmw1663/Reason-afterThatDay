-- 027_telemetry_events.sql
-- X-4 텔레메트리·A/B 인프라 — 1단계 (저장 인프라).
--
-- 정책:
--  · 옵트인 default OFF (PIPA + GDPR 정신) — users.telemetry_opted_in=true인 사용자만 수집
--  · user_id 그대로 보존 — RLS로 본인만 조회. PIPA §35 열람권 정합 (외부 분석 시에만 익명화)
--  · 단일 events 테이블 + jsonb payload — 베타 단계라 SQL 직접 분석. A/B 실험은 별도 후속
--  · 위기 응답·민감 정보(C-SSRS·자해 사고 답변 등)는 payload에 절대 포함 금지 — 호출처에서 차단
--  · 026 ON DELETE CASCADE 패턴으로 계정 삭제 시 events 자동 삭제

create table public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_kind text not null,
  payload jsonb not null default '{}'::jsonb,
  client_timestamp timestamptz not null,
  server_timestamp timestamptz not null default now()
);

create index events_user_kind on public.events(user_id, event_kind);
create index events_kind_time on public.events(event_kind, server_timestamp desc);

alter table public.events enable row level security;

create policy "users_own_events_select" on public.events
  for select using (auth.uid() = user_id);
create policy "users_own_events_insert" on public.events
  for insert with check (auth.uid() = user_id);

-- 옵트인 컬럼
alter table public.users
  add column if not exists telemetry_opted_in boolean not null default false,
  add column if not exists telemetry_opted_in_at timestamptz;

comment on table public.events is
  '텔레메트리 events (X-4). 옵트인 사용자만. user_id 보존(RLS), 민감 정보 payload 금지.';
