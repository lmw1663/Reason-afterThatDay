-- 032_cooling_persona.sql
-- 매듭 트랙(F-1) — graduation_cooling에 페르소나별 cooling_period_days·knot_label·cycle_index 컬럼 추가
-- 스펙: docs/psychology-logic/redesign-graduation.md §5-1
--
-- 비파괴 변경: 모든 신규 컬럼은 NOT NULL DEFAULT — 기존 row는 자동 마이그레이션
-- 기존 status enum('cooling','confirmed','cancelled')은 유지

ALTER TABLE public.graduation_cooling
  ADD COLUMN IF NOT EXISTS cooling_period_days INT NOT NULL DEFAULT 7
    CHECK (cooling_period_days IN (3, 7, 14, 30)),
  ADD COLUMN IF NOT EXISTS knot_label TEXT NOT NULL DEFAULT '매듭'
    CHECK (knot_label IN ('매듭', '마무리', '단절 30일 달성')),
  ADD COLUMN IF NOT EXISTS persona_codes TEXT[] NOT NULL DEFAULT '{}'
    CHECK (persona_codes <@ ARRAY[
      'P01','P02','P03','P04','P05','P06','P07','P08','P09','P10',
      'P11','P12','P13','P14','P15','P16','P17','P18','P19','P20'
    ]::text[]),
  ADD COLUMN IF NOT EXISTS cycle_index INT NOT NULL DEFAULT 1
    CHECK (cycle_index >= 1);

-- 사이클 인덱스 기반 최신 사이클 조회 인덱스
CREATE INDEX IF NOT EXISTS gc_user_cycle_idx
  ON public.graduation_cooling(user_id, cycle_index DESC);

-- cooling_ends_at 산출이 클라이언트·서버 양쪽에서 일관되도록 보장
-- (NULL 허용 유지 — 기존 데이터 호환. 신규 row는 requested_at + cooling_period_days로 계산)

COMMENT ON COLUMN public.graduation_cooling.cooling_period_days IS
  '페르소나별 매듭 준비 기간 (3/7/14/30일). 기본 7일.';
COMMENT ON COLUMN public.graduation_cooling.knot_label IS
  '사용자 노출 라벨. P16/P17=마무리, P20=단절 30일 달성, 그 외=매듭.';
COMMENT ON COLUMN public.graduation_cooling.persona_codes IS
  '매듭 시작 시점의 페르소나 코드 배열 (다중 페르소나 충돌 R5 적용 결과).';
COMMENT ON COLUMN public.graduation_cooling.cycle_index IS
  '같은 user_id 내에서 매듭 사이클 순번 (1부터). 가역성(H1) — 매듭 후 새 사이클 시작 시 증가.';
