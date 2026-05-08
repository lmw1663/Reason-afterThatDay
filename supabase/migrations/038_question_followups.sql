-- ============================================================
-- Migration 038 — 후속 질문 그래프 (question_followups)
-- ============================================================
-- v2 §4 "복합 질문 흐름" 인프라 — 부모 질문 응답 패턴에 따라 자식 질문을
-- 다음 화면 진입 시 자동 노출.
--
-- trigger_type:
--   · answer_changed : 부모 응답이 직전과 달라졌을 때 (이전 값 → 새 값)
--   · answer_equals  : 부모 response_value 가 trigger_value 와 일치할 때
--   · answer_yes     : boolean display_type 부모가 true 일 때 (단축)
--   · answer_no      : boolean display_type 부모가 false 일 때 (단축)
--   · always         : 부모 답변 후 항상 — delay_hours 로 시간차 제어
--
-- 자기 참조(parent_id == child_id) 허용 — 시간차 재질문 패턴.
-- 무한 루프 방지는 클라이언트 단에서 depth=1 강제(useSmartQuestion).

create table if not exists public.question_followups (
  id            uuid primary key default gen_random_uuid(),
  parent_id     text references public.question_pool(id) on delete cascade not null,
  child_id      text references public.question_pool(id) on delete cascade not null,
  trigger_type  text not null
    check (trigger_type in ('answer_changed','answer_equals','answer_yes','answer_no','always')),
  trigger_value jsonb,
  delay_hours   int default 0 check (delay_hours >= 0),
  priority      int default 5,
  created_at    timestamptz default now(),
  unique (parent_id, child_id, trigger_type)
);

create index if not exists question_followups_parent_idx
  on public.question_followups (parent_id);

-- RLS — 질문 풀과 동일 정책: 모두 읽기 가능, 쓰기는 service_role 전용
alter table public.question_followups enable row level security;
create policy "anyone_can_read_followups" on public.question_followups
  for select using (true);

-- ============================================================
-- 시드 — Phase A 핵심 3건 (Phase D 에서 점진 확장)
-- ============================================================
-- 1) 분석에서 헤어진 이유 응답이 *바뀌면* → 다음 진입 시 "고칠 수 있어?" 후속
-- 2) 일기 방향 변화 직후 24h 뒤 → 변화 진정성 체크
-- 3) 솔직한 마음 답한 24h 뒤 → 두려움 체크 (catch/let_go 어느 쪽이든 두려움 점검)
--
-- 발화 채널 주의: child_id의 context 가 hook 호출 화면과 일치해야 발화함.
-- 시드 #2/#3 는 child가 'compass' context — 현재 compass 화면(want/check)은
-- useSmartQuestion 미호출이라 *발화 채널이 없음*. Phase F (또는 후속)에서 compass
-- 진입 hook 추가 시 자동 활성화 예정. 시드 #1 (a_breakup_reason→a_fix_possible/analysis)
-- 만 Phase D 단계에서 즉시 동작.
insert into public.question_followups (parent_id, child_id, trigger_type, delay_hours, priority) values
  ('a_breakup_reason', 'a_fix_possible',  'answer_changed',  0, 9),
  ('j_direction_change', 'c_check_change', 'always',         24, 8),
  ('c_honest_want',      'c_check_fear',   'always',         24, 7)
on conflict (parent_id, child_id, trigger_type) do nothing;
