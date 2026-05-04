import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import {
  recordAssessment,
  getRecoveryTrace,
  getLastAssessmentDate,
} from '@/api/assessments';
import { applyChain, chainInsert } from '@/tests/helpers/supabaseMock';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('recordAssessment', () => {
  it('PHQ9 → 자동 채점 + insert payload에 raw_score·band 포함', async () => {
    const chain = applyChain(supabase.from as Mock, chainInsert());
    const result = await recordAssessment(
      'user-1',
      'PHQ9',
      { item1: 3, item2: 3, item3: 3, item4: 3, item5: 3, item6: 3, item7: 3, item8: 3, item9: 3 },
      'd7',
    );
    expect(result).toEqual({ rawScore: 27, band: 'severe' });
    const row = chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.user_id).toBe('user-1');
    expect(row.instrument).toBe('PHQ9');
    expect(row.raw_score).toBe(27);
    expect(row.band).toBe('severe');
    expect(row.source).toBe('d7');
  });

  it('GAD7 → 자동 채점', async () => {
    applyChain(supabase.from as Mock, chainInsert());
    const result = await recordAssessment(
      'user-1',
      'GAD7',
      { item1: 0, item2: 0, item3: 0, item4: 0, item5: 0, item6: 0, item7: 0 },
      'onboarding',
    );
    expect(result).toEqual({ rawScore: 0, band: 'minimal' });
  });

  it('RSE → 자동 채점', async () => {
    applyChain(supabase.from as Mock, chainInsert());
    const r10 = { item1: 2, item2: 2, item3: 2, item4: 2, item5: 2, item6: 2, item7: 2, item8: 2, item9: 2, item10: 2 };
    const result = await recordAssessment('user-1', 'RSE', r10, 'manual');
    expect(result.rawScore).toBe(20);
    expect(result.band).toBe('avg');
  });

  it('미지원 instrument(PHQ2) → raw_score·band null로 저장', async () => {
    const chain = applyChain(supabase.from as Mock, chainInsert());
    const result = await recordAssessment('user-1', 'PHQ2', { item1: 1, item2: 1 }, 'manual');
    expect(result).toEqual({ rawScore: null, band: null });
    const row = chain.insert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.raw_score).toBeNull();
    expect(row.band).toBeNull();
  });

  it('insert 에러 → throw', async () => {
    applyChain(supabase.from as Mock, chainInsert(new Error('rls')));
    await expect(
      recordAssessment('user-1', 'PHQ9', { item1: 0 }, 'manual'),
    ).rejects.toThrow();
  });
});

describe('getRecoveryTrace', () => {
  it('빈 응답 → 모든 시계열 빈 배열 + snapshot null', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const trace = await getRecoveryTrace('user-1');
    expect(trace.phq9).toEqual([]);
    expect(trace.gad7).toEqual([]);
    expect(trace.rse).toEqual([]);
    expect(trace.d0Snapshot).toEqual({ phq9: null, gad7: null, rse: null });
    expect(trace.currentSnapshot).toEqual({ phq9: null, gad7: null, rse: null });
  });

  it('각 instrument별 시계열 분리 + d0/current snapshot', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { assessed_at: '2026-04-01', source: 'onboarding', instrument: 'PHQ9', raw_score: 18, band: 'modSevere' },
          { assessed_at: '2026-04-08', source: 'd7',         instrument: 'PHQ9', raw_score: 12, band: 'moderate' },
          { assessed_at: '2026-04-01', source: 'onboarding', instrument: 'GAD7', raw_score: 14, band: 'moderate' },
          { assessed_at: '2026-04-30', source: 'd30',        instrument: 'RSE',  raw_score: 22, band: 'avg' },
        ],
        error: null,
      }),
    });
    const trace = await getRecoveryTrace('user-1');
    expect(trace.phq9.length).toBe(2);
    expect(trace.gad7.length).toBe(1);
    expect(trace.rse.length).toBe(1);
    expect(trace.d0Snapshot).toEqual({ phq9: 18, gad7: 14, rse: 22 });
    expect(trace.currentSnapshot).toEqual({ phq9: 12, gad7: 14, rse: 22 });
  });

  it('raw_score null 행 → 시계열에서 제외', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [
          { assessed_at: '2026-04-01', source: 'manual', instrument: 'PHQ9', raw_score: null, band: null },
          { assessed_at: '2026-04-02', source: 'manual', instrument: 'PHQ9', raw_score: 5, band: 'mild' },
        ],
        error: null,
      }),
    });
    const trace = await getRecoveryTrace('user-1');
    expect(trace.phq9.length).toBe(1);
    expect(trace.phq9[0].rawScore).toBe(5);
  });
});

describe('getLastAssessmentDate', () => {
  it('정상 응답 → 가장 최근 assessed_at 반환', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { assessed_at: '2026-04-15T00:00:00Z' },
        error: null,
      }),
    });
    const r = await getLastAssessmentDate('user-1', 'PHQ9');
    expect(r).toBe('2026-04-15T00:00:00Z');
  });

  it('데이터 없음 → null', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
    const r = await getLastAssessmentDate('user-1', 'PHQ9');
    expect(r).toBeNull();
  });

  it('error → null (fail-open)', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: new Error('rls') }),
    });
    const r = await getLastAssessmentDate('user-1', 'PHQ9');
    expect(r).toBeNull();
  });
});
