-- 024_about_me_categories_g5b.sql
-- C-2-G-5b: about-me 카테고리 4종 신규 추가 (reality_check·body·needs·identity)
--
-- 매트릭스 §2 C5의 페르소나 우선 트랙:
--   reality_check — P01 자기 판단 손상 (line 41 "현실 검증 워크시트")
--   body          — P02 회피형 (line 57 "신체 신호 체크인 — 잠/식욕/멍함")
--   needs         — P09 헌신 소진 (line 169 "오늘 너만의 작은 욕구 1개")
--   identity      — P08 장기 권태 (line 156 "/about-me/identity 메인 동선")
--
-- 비파괴 변경 — 기존 6 카테고리 행은 영향 없음. CHECK constraint만 확장.

ALTER TABLE public.self_reflections
  DROP CONSTRAINT IF EXISTS self_reflections_category_check;

ALTER TABLE public.self_reflections
  ADD CONSTRAINT self_reflections_category_check CHECK (category IN (
    'love_self',
    'ideal_match',
    'self_love',
    'strengths',
    'self_care_in_relationship',
    'self_care_alone',
    -- G-5b 신규
    'reality_check',
    'body',
    'needs',
    'identity'
  ));
