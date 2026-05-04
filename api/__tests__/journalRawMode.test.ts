import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import { countRawModeToday } from '@/api/journal';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('countRawModeToday', () => {
  it('count head=true 호출 — is_raw_mode=true 필터링', async () => {
    const eqSpy = vi.fn().mockReturnThis();
    const gteSpy = vi.fn().mockReturnThis();
    const lteSpy = vi.fn().mockResolvedValue({ count: 1, error: null });
    const selectSpy = vi.fn().mockReturnThis();
    (supabase.from as Mock).mockReturnValue({
      select: selectSpy,
      eq: eqSpy,
      gte: gteSpy,
      lte: lteSpy,
    });
    const c = await countRawModeToday('user-1');
    expect(c).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('journal_entries');
    expect(selectSpy.mock.calls[0]).toEqual(['*', { count: 'exact', head: true }]);
    // eq는 user_id + is_raw_mode 두 번
    const eqArgs = eqSpy.mock.calls.map((c) => c[0]);
    expect(eqArgs).toContain('user_id');
    expect(eqArgs).toContain('is_raw_mode');
  });

  it('count null → 0', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ count: null, error: null }),
    });
    const c = await countRawModeToday('user-1');
    expect(c).toBe(0);
  });

  it('error → throw', async () => {
    (supabase.from as Mock).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockResolvedValue({ count: null, error: new Error('rls') }),
    });
    await expect(countRawModeToday('user-1')).rejects.toThrow();
  });
});
