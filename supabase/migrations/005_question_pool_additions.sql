-- ============================================================
-- Migration 005 — 나침반 체크 + 졸업 회한 질문 추가
-- ============================================================

-- 나침반 check.tsx의 5개 채점 질문을 풀에 등록 (cross-track 연계)
INSERT INTO public.question_pool (id, text, context, weight) VALUES
  ('c_check_past',   '6개월 전으로 돌아가도 같은 선택을 할 것 같아?',          '{"compass"}', 7),
  ('c_check_change', '상대방이 바뀔 수 있다고 진심으로 믿어?',                 '{"compass"}', 7),
  ('c_check_harder', '혼자인 지금이 같이였을 때보다 더 힘들어?',                '{"compass"}', 6),
  ('c_check_free',   '상대 없이 내 삶을 상상하면 자유롭다는 느낌이 들어?',       '{"compass"}', 6),
  ('c_check_fear',   '지금 이 결정이 두려움에서 온 게 아니라고 할 수 있어?',     '{"compass"}', 7)
ON CONFLICT (id) DO NOTHING;

-- 졸업 confirm 화면용 회한(regret) 카테고리 질문
INSERT INTO public.question_pool (id, text, context, weight) VALUES
  ('g_regret_best',   '이 관계에서 제일 아쉬웠던 기억이 뭐야?',  '{"graduation"}', 8),
  ('g_regret_unsaid', '아직 전하지 못한 말이 있어?',             '{"graduation"}', 8)
ON CONFLICT (id) DO NOTHING;
