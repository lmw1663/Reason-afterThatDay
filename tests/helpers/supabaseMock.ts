import { vi, type Mock } from 'vitest';

/**
 * Supabase query chain mock 표준 헬퍼.
 *
 * 4개 API 테스트 파일(contactUrges/journalRawMode/processingSuspension/telemetry)에
 * 동일한 mock chain 빌더가 중복 정의되어 있던 것을 단일화. 호출 측은 vi.mock으로
 * '@/api/supabase'를 stub한 뒤 본 모듈의 chain 빌더를 적용하면 된다.
 *
 * 사용 예:
 *   import { vi, beforeEach, type Mock } from 'vitest';
 *   vi.mock('@/api/supabase', () => ({ supabase: { from: vi.fn() } }));
 *   import { supabase } from '@/api/supabase';
 *   import { applyChain, chainSelectMaybeSingle } from '@/tests/helpers/supabaseMock';
 *
 *   beforeEach(() => vi.resetAllMocks());
 *
 *   it('...', async () => {
 *     const chain = applyChain(supabase.from as Mock, chainSelectMaybeSingle({ foo: 1 }));
 *     // chain.select / chain.eq / chain.maybeSingle은 모두 spy
 *   });
 *
 * 정책:
 *  · 단순 단일-테이블 쿼리만 커버. 다중 테이블 분기(예: trackEvent의 users→events)는
 *    호출 측에서 supabase.from의 mockImplementation으로 처리
 *  · 모든 헬퍼는 *체인 객체*만 반환 — applyChain으로 from() 부착은 명시적으로
 *  · result 인자는 supabase 표준 응답 형태 ({ data, error } 또는 { count, error })
 */

/** from()의 mockReturnValue로 chain 부착하고 chain 그대로 반환. */
export function applyChain<T>(fromMock: Mock, chain: T): T {
  fromMock.mockReturnValue(chain);
  return chain;
}

/** .from(t).select().eq()*.maybeSingle() — 단일 row 조회. */
export function chainSelectMaybeSingle(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  };
}

/** .from(t).update(payload).eq() — 단일 row 갱신. */
export function chainUpdate(error: unknown = null) {
  return {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ error }),
  };
}

/** .from(t).insert(row) — 단일 row 삽입. */
export function chainInsert(error: unknown = null) {
  return {
    insert: vi.fn().mockResolvedValue({ error }),
  };
}

/**
 * .from(t).select().eq()*.gte().order() — 시계열 데이터 조회 (배열 응답).
 * eq는 여러 번 호출 가능 (mockReturnThis).
 */
export function chainSelectOrder(data: unknown[] | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data, error }),
  };
}

/**
 * .from(t).select('*', { count:'exact', head:true }).eq()*.gte() — count head 쿼리
 * (단일 윈도우, gte로 종료).
 */
export function chainCountAtGte(count: number | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockResolvedValue({ count, error }),
  };
}

/**
 * .from(t).select('*', { count:'exact', head:true }).eq()*.gte().lte() — count head 쿼리
 * (양 끝 윈도우, lte로 종료).
 */
export function chainCountAtLte(count: number | null, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockResolvedValue({ count, error }),
  };
}
