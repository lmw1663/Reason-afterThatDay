import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import { recordUrge, fetchUrgeTrend, fetchTodayUrgeCount } from '@/api/contactUrges';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('recordUrge', () => {
  it('insert 호출 — user_id + urge_count=1', async () => {
    const insertSpy = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as Mock).mockReturnValue({ insert: insertSpy });
    await recordUrge('user-1');
    expect(supabase.from).toHaveBeenCalledWith('contact_urges');
    expect(insertSpy.mock.calls[0][0]).toEqual({ user_id: 'user-1', urge_count: 1 });
  });

  it('error → throw', async () => {
    (supabase.from as Mock).mockReturnValue({
      insert: vi.fn().mockResolvedValue({ error: new Error('rls') }),
    });
    await expect(recordUrge('user-1')).rejects.toThrow();
  });
});

describe('fetchUrgeTrend', () => {
  it('빈 데이터 → 7개 0-카운트 일자 반환 (오늘 포함, 시간순)', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
    });
    const trend = await fetchUrgeTrend('user-1');
    expect(trend.length).toBe(7);
    expect(trend.every((d) => d.count === 0)).toBe(true);
    // 마지막 일자 = 오늘 (로컬 자정 기준)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    expect(trend[trend.length - 1].date).toBe(todayKey);
  });

  it('같은 날 다중 row → 카운트 누적', async () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const iso = today.toISOString();
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: [{ reported_at: iso }, { reported_at: iso }, { reported_at: iso }],
        error: null,
      }),
    });
    const trend = await fetchUrgeTrend('user-1');
    expect(trend[trend.length - 1].count).toBe(3);
  });

  it('error → throw', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: new Error('rls') }),
    });
    await expect(fetchUrgeTrend('user-1')).rejects.toThrow();
  });
});

describe('fetchTodayUrgeCount', () => {
  it('count head=true 호출 → 숫자 반환', async () => {
    const selectSpy = vi.fn().mockReturnThis();
    (supabase.from as Mock).mockReturnValue({
      select: selectSpy,
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: 4, error: null }),
    });
    const c = await fetchTodayUrgeCount('user-1');
    expect(c).toBe(4);
    expect(selectSpy.mock.calls[0]).toEqual(['*', { count: 'exact', head: true }]);
  });

  it('count null → 0', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: null, error: null }),
    });
    const c = await fetchTodayUrgeCount('user-1');
    expect(c).toBe(0);
  });

  it('error → throw', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockResolvedValue({ count: null, error: new Error('rls') }),
    });
    await expect(fetchTodayUrgeCount('user-1')).rejects.toThrow();
  });
});
