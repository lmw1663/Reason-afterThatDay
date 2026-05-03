-- 020_safety_protocol.sql
-- C-SSRS 안전 프로토콜 — B-1
--
-- 본 마이그레이션은 사용자 위기 평가(C-SSRS 6항)와 안전 잠금(앱 일부 트랙 차단) 인프라를 만든다.
--
-- 정책 근거: docs/psychology-logic/검증-임상관점.md §2-1
--          docs/psychology-logic/구현계획.md Task 1-1
--
-- 라이선스: C-SSRS는 Columbia Lighthouse Project 등록 후 무료 사용. B-0-1 진행 중.
--
-- 졸업 트랙은 A-4로 일시 보류 중이지만, graduation_locked 컬럼은 보류 해제 후 활용 위해 선구축.
-- decision_locked는 분석·나침반 등 결정 트랙에 즉시 적용 가능.
--
-- 의료정보 보존 정책: 5년 후 자동 익명화 (별도 cron, 추후 마이그레이션에서 구현).

create table public.crisis_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  assessed_at timestamptz not null default now(),
  source text not null check (source in ('onboarding', 'modal_trigger', 'periodic', 'graduation')),
  -- C-SSRS 6항 응답
  q1_passive_ideation boolean not null default false,  -- "죽고 싶다"는 수동적 사고
  q2_active_ideation boolean not null default false,   -- 적극적인 자살 사고
  q3_method boolean not null default false,            -- 자살 수단 고려
  q4_intent boolean not null default false,            -- 의도 (실행 의향)
  q5_plan boolean not null default false,              -- 구체적 계획
  q6_recent_attempt boolean not null default false,    -- 지난 3개월 내 시도
  -- 산출 등급
  severity text not null check (severity in ('safe', 'caution', 'high', 'urgent')),
  -- 처치 액션 기록 (예: hotline_shown, lockout_created, redial_pushed)
  actions_triggered text[] not null default '{}',
  -- 24h 재확인 추적
  followup_due_at timestamptz,
  followup_completed_at timestamptz,
  created_at timestamptz default now()
);

create index crisis_assessments_user_time on public.crisis_assessments(user_id, assessed_at desc);
create index crisis_assessments_followup on public.crisis_assessments(followup_due_at)
  where followup_completed_at is null and followup_due_at is not null;

comment on table public.crisis_assessments is
  'C-SSRS 위기 평가 응답·산출 등급·처치 액션 이력. 5년 후 익명화.';

-- 앱 안전 잠금 상태 (사용자당 1행)
create table public.safety_lockouts (
  user_id uuid primary key references public.users(id) on delete cascade,
  locked_at timestamptz not null default now(),
  reason text not null,                          -- 'crisis_assessment' | 'manual'
  graduation_locked boolean not null default false,
  decision_locked boolean not null default false,
  expires_at timestamptz,                         -- null = 무기한 (수동 해제만)
  released_at timestamptz,
  released_by text                                -- 'user_acknowledgment' | 'followup_resolution'
);

comment on table public.safety_lockouts is
  '사용자별 안전 잠금 상태. urgent/high severity 시 graduation/decision 트랙 자동 차단.';

-- RLS
alter table public.crisis_assessments enable row level security;
alter table public.safety_lockouts enable row level security;

create policy "users_own_crisis" on public.crisis_assessments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "users_own_lockout" on public.safety_lockouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
