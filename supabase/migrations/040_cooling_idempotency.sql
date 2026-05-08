-- 040_cooling_idempotency.sql
-- 쿨링 회고·체크인 저장의 멱등성 보장.
-- 배경: 자동/수동 재시도 시 같은 응답이 중복 누적되던 문제 해결.
--   1. cooling_reflections: 같은 (cooling, day, type)에 row 중복 생성 가능했음
--   2. graduation_cooling.checkin_responses (jsonb 배열): read-modify-write로 중복 push 가능했음

-- ============================================================
-- 1. cooling_reflections — UNIQUE 제약
-- ============================================================
-- 의미: 한 cooling_period의 한 day에 한 reflection_type은 1행만.
-- day=5 → 'learning' 1행 / day=6 → 'future_plan' 1행 자연스러움.

-- 기존 중복 정리 — uuid PK 비교로 임의의 1행만 보존 (시간순 X, 동일 그룹 내 dedupe만 보장).
-- reflection_text가 다를 가능성은 매우 낮고(같은 cooling+day+type), 향후 upsert로 최신 텍스트가 덮어씀.
DELETE FROM public.cooling_reflections a
USING public.cooling_reflections b
WHERE a.id < b.id
  AND a.cooling_period_id = b.cooling_period_id
  AND a.day = b.day
  AND a.reflection_type = b.reflection_type;

ALTER TABLE public.cooling_reflections
  ADD CONSTRAINT cooling_reflections_period_day_type_unique
  UNIQUE (cooling_period_id, day, reflection_type);

-- ============================================================
-- 2. graduation_cooling.checkin_responses — atomic dedupe 함수
-- ============================================================
-- jsonb 배열은 UNIQUE 제약이 불가능하므로 SQL 함수에서 atomic하게 dedupe.
-- 동일 응답(p_response와 정확히 일치하는 객체)이 이미 있으면 skip.
-- SECURITY INVOKER — 호출자의 RLS(auth.uid() = user_id)가 그대로 적용됨.

CREATE OR REPLACE FUNCTION public.add_unique_checkin_response(
  p_cooling_id uuid,
  p_response   jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- 단일 UPDATE로 atomic dedupe — SELECT/UPDATE 분리 시 동시 호출 race 발생 가능했음.
  -- WHERE 절에서 containment 체크 + UPDATE를 한 행 락 안에서 처리.
  -- 이미 동일 응답이 있거나 row가 RLS로 차단되면 0행 영향 — silent return과 동일 효과.
  UPDATE public.graduation_cooling
  SET checkin_responses = checkin_responses || jsonb_build_array(p_response)
  WHERE id = p_cooling_id
    AND NOT (checkin_responses @> jsonb_build_array(p_response));
END;
$$;

-- 인증된 사용자에게 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.add_unique_checkin_response(uuid, jsonb) TO authenticated;
