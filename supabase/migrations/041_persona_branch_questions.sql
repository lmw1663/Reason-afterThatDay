-- ============================================================
-- Migration 041 — 페르소나 분기 일기 질문 (오프라인 폴백 → DB 정합)
-- ============================================================
-- C-2-G-3b 페르소나별 일기 booster 질문 4건. 오프라인 폴백
-- (constants/questionPool.ts) 에만 존재했고 DB 시드는 누락 — DB 정합 회복.
--
-- weight=2 (낮음) — 일반 사용자 풀에서는 거의 노출 안 됨. 페르소나별 booster 가
-- 가산점(+15~+20) 부여해 *해당 페르소나에게만 우선 노출*되는 구조.
--
-- category 는 null — 일상 일기 특성상 졸업/매듭 그룹 요약 대상이 아님.
-- 부스터/차단 매트릭스: constants/personaQuestionWeights.ts

insert into public.question_pool (id, text, context, weight, category) values
  ('j_decision_recall', '왜 그 결정을 했는지, 그날의 일기를 다시 만나러 가볼래?', '{"journal"}', 2, null),
  ('j_two_minds',       '오늘은 두 마음이 어떻게 같이 있었어?',                     '{"journal"}', 2, null),
  ('j_fact_only',       '해석 말고, 그날 *사실*만 써본다면?',                       '{"journal"}', 2, null),
  ('j_unspoken',        '그때 못 한 말, 지금 여기에 풀어볼래?',                     '{"journal"}', 2, null)
on conflict (id) do nothing;
