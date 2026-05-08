-- ============================================================
-- Migration 037 — question_pool v2 메타 컬럼
-- ============================================================
-- v2 §3 schema 정합 + 시간차 재질문/카테고리 그룹핑/쿨다운 면제 인프라.
-- category 는 nullable — 일상 일기 질문(j_today_mood 등)은 그룹핑 대상이 아니므로 미지정.
-- 정책 SSOT: docs/question-pool-implementation.md §6, plan §1·§4·§6

alter table public.question_pool
  add column if not exists category text
    check (category in (
      'pros','cons','reason','regret','lesson','future',
      'direction','need','fear','self_care'
    )),
  add column if not exists display_type text
    check (display_type in ('pill','free_text','slider','choice','boolean'))
    default 'free_text',
  add column if not exists options jsonb,
  add column if not exists revisit_after_days int check (revisit_after_days is null or revisit_after_days > 0),
  add column if not exists revisit_window_days int default 3 check (revisit_window_days >= 0),
  add column if not exists allow_cooldown_bypass boolean default false;

-- ------------------------------------------------------------
-- 카테고리 backfill — 003·005 시드 ID 기반 명시적 매핑
-- ------------------------------------------------------------
update public.question_pool set category = 'pros'      where id in ('a_best_memory');
update public.question_pool set category = 'cons'      where id in ('a_changed_you','a_fix_possible');
update public.question_pool set category = 'reason'    where id in ('a_breakup_reason');
update public.question_pool set category = 'regret'    where id in ('g_regret_best','g_regret_unsaid','g_forgive');
update public.question_pool set category = 'lesson'    where id in ('g_learned','g_letter_self');
update public.question_pool set category = 'future'    where id in ('g_next_chapter','c_6month_later');
update public.question_pool set category = 'direction' where id in ('j_direction_change','j_direction_steady','c_honest_want');
update public.question_pool set category = 'fear'      where id in ('c_fear_catch','c_fear_letgo','c_check_fear');
update public.question_pool set category = 'self_care' where id in ('x_self_care','j_body_feeling');

-- ------------------------------------------------------------
-- display_type backfill — 채점형 boolean / 방향 picker는 choice로 명시
-- ------------------------------------------------------------
update public.question_pool set display_type = 'boolean'
  where id in ('c_check_past','c_check_change','c_check_harder','c_check_free','c_check_fear');
update public.question_pool set display_type = 'choice'
  where id in ('j_direction_change','j_direction_steady');

-- ------------------------------------------------------------
-- 시간차 재질문 정책
--   · reason / direction / fix_possible: D+7 (window 3) — 마음이 단단해졌는지 재확인
--   · regret / lesson:                   D+30 (window 5) — 긴 호흡 회한·교훈 재방문
-- ------------------------------------------------------------
update public.question_pool set revisit_after_days = 7, revisit_window_days = 3
  where id in ('a_breakup_reason','a_fix_possible','c_honest_want');
update public.question_pool set revisit_after_days = 30, revisit_window_days = 5
  where id in ('g_regret_best','g_learned');

-- ------------------------------------------------------------
-- 쿨다운 면제 — 방향 변화 트리거는 일반 72h 쿨다운에 막히면 안 됨
-- ------------------------------------------------------------
update public.question_pool set allow_cooldown_bypass = true
  where id in ('j_direction_change','j_direction_steady');
