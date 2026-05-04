import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import { countRawModeToday } from '@/api/journal';
import { applyChain, chainCountAtLte } from '@/tests/helpers/supabaseMock';

beforeEach(() => {
  vi.resetAllMocks();
});

describe('countRawModeToday', () => {
  it('count head=true 호출 — is_raw_mode=true 필터링', async () => {
    const chain = applyChain(supabase.from as Mock, chainCountAtLte(1));
    const c = await countRawModeToday('user-1');
    expect(c).toBe(1);
    expect(supabase.from).toHaveBeenCalledWith('journal_entries');
    expect(chain.select.mock.calls[0]).toEqual(['*', { count: 'exact', head: true }]);
    // eq는 user_id + is_raw_mode 두 번
    const eqArgs = chain.eq.mock.calls.map((c) => c[0]);
    expect(eqArgs).toContain('user_id');
    expect(eqArgs).toContain('is_raw_mode');
  });

  it('count null → 0', async () => {
    applyChain(supabase.from as Mock, chainCountAtLte(null));
    const c = await countRawModeToday('user-1');
    expect(c).toBe(0);
  });

  it('error → throw', async () => {
    applyChain(supabase.from as Mock, chainCountAtLte(null, new Error('rls')));
    await expect(countRawModeToday('user-1')).rejects.toThrow();
  });
});
