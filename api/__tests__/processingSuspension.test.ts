import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

// supabase 모듈 자체를 mock — env var 의존 회피 + createClient 호출 차단
vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import {
  getProcessingSuspension,
  updateProcessingSuspension,
} from '@/api/processingSuspension';
import {
  applyChain,
  chainSelectMaybeSingle,
  chainUpdate,
} from '@/tests/helpers/supabaseMock';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('getProcessingSuspension', () => {
  it('정상 응답 → 변환된 ProcessingSuspension 반환', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle({
      notifications_suspended: true,
      ai_analysis_suspended: false,
      suspension_updated_at: '2026-05-04T12:00:00Z',
    }));
    const result = await getProcessingSuspension('user-1');
    expect(result).toEqual({
      notificationsSuspended: true,
      aiAnalysisSuspended: false,
      updatedAt: '2026-05-04T12:00:00Z',
    });
  });

  it('데이터 부재(null) → DEFAULT', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle(null));
    const result = await getProcessingSuspension('user-1');
    expect(result).toEqual({
      notificationsSuspended: false,
      aiAnalysisSuspended: false,
      updatedAt: null,
    });
  });

  it('error 응답 → DEFAULT (fail-open)', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle(null, new Error('db error')));
    const result = await getProcessingSuspension('user-1');
    expect(result.notificationsSuspended).toBe(false);
    expect(result.aiAnalysisSuspended).toBe(false);
  });

  it('컬럼 부재 → false fallback', async () => {
    applyChain(supabase.from as Mock, chainSelectMaybeSingle({ /* 빈 row */ }));
    const result = await getProcessingSuspension('user-1');
    expect(result.notificationsSuspended).toBe(false);
    expect(result.aiAnalysisSuspended).toBe(false);
    expect(result.updatedAt).toBeNull();
  });
});

describe('updateProcessingSuspension', () => {
  it('빈 patch → DB 호출 없이 early return', async () => {
    const fromSpy = supabase.from as Mock;
    await updateProcessingSuspension('user-1', {});
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('notificationsSuspended만 patch → 해당 컬럼 + timestamp 업데이트', async () => {
    const chain = applyChain(supabase.from as Mock, chainUpdate());
    await updateProcessingSuspension('user-1', { notificationsSuspended: true });
    expect(supabase.from).toHaveBeenCalledWith('users');
    const call = chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(call.notifications_suspended).toBe(true);
    expect(call.ai_analysis_suspended).toBeUndefined();
    expect(typeof call.suspension_updated_at).toBe('string');
  });

  it('aiAnalysisSuspended만 patch', async () => {
    const chain = applyChain(supabase.from as Mock, chainUpdate());
    await updateProcessingSuspension('user-1', { aiAnalysisSuspended: false });
    const call = chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(call.ai_analysis_suspended).toBe(false);
    expect(call.notifications_suspended).toBeUndefined();
  });

  it('두 필드 모두 patch', async () => {
    const chain = applyChain(supabase.from as Mock, chainUpdate());
    await updateProcessingSuspension('user-1', {
      notificationsSuspended: true,
      aiAnalysisSuspended: true,
    });
    const call = chain.update.mock.calls[0][0] as Record<string, unknown>;
    expect(call.notifications_suspended).toBe(true);
    expect(call.ai_analysis_suspended).toBe(true);
  });

  it('error → throw', async () => {
    applyChain(supabase.from as Mock, chainUpdate(new Error('rls violation')));
    await expect(
      updateProcessingSuspension('user-1', { notificationsSuspended: true }),
    ).rejects.toThrow();
  });
});
