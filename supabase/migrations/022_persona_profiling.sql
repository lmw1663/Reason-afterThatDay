-- 022_persona_profiling.sql
-- 8축 프로파일 + 페르소나 분류 인프라 — C-1-3
--
-- 정책 근거: docs/psychology-logic/페르소나-분류체계.md (8축 + 분기 알고리즘)
--           docs/psychology-logic/구현계획.md Task 2-3
--
-- 사별(P13)은 본 앱 도메인 밖 — 분류 알고리즘에서 제외 (C-1-2 정책)
-- ECR-R/RRS 라이선스 미확인 — 본 마이그레이션은 스키마만, 점수 부여는 자유 척도(PHQ-9·GAD-7·Rosenberg·C-SSRS)만 사용
--
-- 의료정보 보존 정책: 5년 후 자동 익명화 (별도 cron, 추후 마이그레이션)

-- 8축 측정값 — 시점별 누적
create table public.psych_profile_axes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  measured_at timestamptz not null default now(),
  source text not null check (source in ('onboarding', 'd7', 'd14', 'd30', 'd60', 'd90', 'manual')),
  -- 8축 (페르소나-분류체계.md §2 정의)
  a1_attachment      smallint check (a1_attachment      between 0 and 3),  -- 0 안정 / 1 불안 / 2 회피 / 3 두려움
  a2_initiator       smallint check (a2_initiator       between 0 and 3),  -- 0 합의 / 1 본인 / 2 상대 / 3 잠수·통보
  a3_breakup_mode    smallint check (a3_breakup_mode    between 0 and 3),  -- 0 점진 / 1 명확 / 2 갑작 / 3 강제 (사망 제외)
  a4_duration        smallint check (a4_duration        between 0 and 3),  -- 0 <6m / 1 6m–2y / 2 2–5y / 3 5y+
  a5_health          smallint check (a5_health          between 0 and 3),  -- 0 건강 / 1 혼합 / 2 유해 / 3 학대·외도
  a6_complexity      smallint check (a6_complexity      between 0 and 3),  -- 0 없음 / 1 공동지인 / 2 동거·재정 / 3 결혼·자녀
  a7_dominant_emotion smallint check (a7_dominant_emotion between 0 and 4),  -- 0 슬픔 / 1 분노 / 2 죄책감 / 3 공허 / 4 혼란
  a8_crisis          smallint check (a8_crisis          between 0 and 3),  -- 0 안전 / 1 주의 / 2 고위험 / 3 즉시개입
  created_at timestamptz default now()
);

create index psych_profile_axes_user_time on public.psych_profile_axes(user_id, measured_at desc);

comment on table public.psych_profile_axes is
  '8축 측정값. 온보딩·D+N 재분류 시점마다 새 행 추가. 5년 후 익명화.';

-- 페르소나 추정 결과 (이력 보존)
create table public.personas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  estimated_at timestamptz not null default now(),
  source text not null check (source in ('onboarding', 'd7', 'd14', 'd30', 'd60', 'd90', 'manual')),
  -- P01~P20 코드. P13(사별)은 도메인 밖이라 분류기가 반환하지 않음 (C-1-2)
  primary_persona text not null check (primary_persona ~ '^P(0[1-9]|1[0-9]|20)$' and primary_persona <> 'P13'),
  primary_score smallint not null,
  secondary_persona text check (secondary_persona is null or (secondary_persona ~ '^P(0[1-9]|1[0-9]|20)$' and secondary_persona <> 'P13')),
  secondary_score smallint,
  raw_scores jsonb not null,         -- {P01: 5, P02: 3, ...} 디버그·재현용
  axes_snapshot jsonb not null,      -- 8축 값 그 시점 스냅샷
  active boolean not null default true,
  created_at timestamptz default now()
);

-- 사용자당 active=true 행은 1개만 (가장 최근 분류 결과)
create unique index personas_one_active_per_user
  on public.personas(user_id) where active;

create index personas_user_time on public.personas(user_id, estimated_at desc);

comment on table public.personas is
  '페르소나 추정 결과 이력. active=true 행이 현재 분류. 재분류 시 이전 행 active=false로 갱신 후 새 행 insert.';

-- RLS
alter table public.psych_profile_axes enable row level security;
alter table public.personas enable row level security;

create policy "users_own_axes" on public.psych_profile_axes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_personas" on public.personas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
