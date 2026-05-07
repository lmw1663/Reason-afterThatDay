-- 036_axes_a9_a10.sql
-- 페르소나 분류 8축 → 10축 확장 (Phase H-1).
--
-- 정책 근거:
--  · docs/psychology-logic/페르소나-분류체계.md §2 8축 정의 (a1~a8)
--  · TODO.md Phase H — PHQ-2/GAD-2 옵트인 응답을 분류에 정식 반영
--
-- 추가 축:
--  · a9_depression — PHQ-2 (0~6) → 0~3 매핑 (양성 임계 ≥3 = 축 ≥2)
--  · a10_anxiety   — GAD-2 (0~6) → 0~3 매핑 (양성 임계 ≥3 = 축 ≥2)
--
-- 호환성:
--  · NULL 허용 = 미측정 (옵트인 안 한 사용자). 기존 행은 모두 NULL로 채워짐.
--  · classifyPersona의 matchedRuleKeys()는 NULL/undefined 시 RuleKey push 하지 않음
--    → 비옵트인 사용자 분류 결과는 8축 시절과 100% 동일 (공정성 보장).
--
-- psych_assessments(030)는 instrument enum에 'PHQ2'/'GAD2'를 이미 포함 — 추가 마이그 불필요.

alter table public.psych_profile_axes
  add column a9_depression smallint check (a9_depression between 0 and 3),
  add column a10_anxiety   smallint check (a10_anxiety   between 0 and 3);

comment on column public.psych_profile_axes.a9_depression is
  '우울 축 (PHQ-2 기반, 0~3, NULL=미측정). 옵트인 사용자만 측정. ≥2면 양성.';
comment on column public.psych_profile_axes.a10_anxiety is
  '불안 축 (GAD-2 기반, 0~3, NULL=미측정). 옵트인 사용자만 측정. ≥2면 양성.';
