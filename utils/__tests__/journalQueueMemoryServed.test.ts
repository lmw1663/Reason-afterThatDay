import { describe, it, expect } from 'vitest';
import {
  pruneMemoryServed,
  recentMemoryCategories,
  appendMemoryServed,
  MEMORY_SERVED_MAX,
  type MemoryServedEntry,
} from '@/utils/journalQueueMemoryServed';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 4, 30, 0, 0, 0);

describe('pruneMemoryServed — 7일 윈도우 + 상한', () => {
  it('7일 이내 항목만 남김', () => {
    const entries: MemoryServedEntry[] = [
      { category: 'painful', ts: NOW - 1 * DAY },
      { category: 'growth', ts: NOW - 6 * DAY },
      { category: 'happy', ts: NOW - 8 * DAY }, // 만료
    ];
    const out = pruneMemoryServed(entries, NOW);
    expect(out.map((e) => e.category)).toEqual(['painful', 'growth']);
  });

  it('정확히 7일 경계는 유지 (<=)', () => {
    const entries: MemoryServedEntry[] = [{ category: 'miss', ts: NOW - 7 * DAY }];
    expect(pruneMemoryServed(entries, NOW)).toHaveLength(1);
  });

  it('상한 초과 시 가장 오래된 것부터 drop', () => {
    const entries: MemoryServedEntry[] = Array.from(
      { length: MEMORY_SERVED_MAX + 5 },
      (_, i) => ({ category: 'painful' as const, ts: NOW - i * 1000 }),
    );
    expect(pruneMemoryServed(entries, NOW)).toHaveLength(MEMORY_SERVED_MAX);
  });
});

describe('recentMemoryCategories — 중복 제거 + 7일 윈도우', () => {
  it('최근 7일 카테고리만 중복 없이 반환', () => {
    const entries: MemoryServedEntry[] = [
      { category: 'painful', ts: NOW - 1 * DAY },
      { category: 'painful', ts: NOW - 2 * DAY }, // 중복
      { category: 'growth', ts: NOW - 3 * DAY },
      { category: 'happy', ts: NOW - 9 * DAY }, // 만료 → 제외
    ];
    const out = recentMemoryCategories(entries, NOW);
    expect(out).toContain('painful');
    expect(out).toContain('growth');
    expect(out).not.toContain('happy');
    expect(out.filter((c) => c === 'painful')).toHaveLength(1);
  });

  it('빈 배열 → 빈 배열', () => {
    expect(recentMemoryCategories([], NOW)).toEqual([]);
  });
});

describe('appendMemoryServed — 누적 후 prune', () => {
  it('새 카테고리를 끝에 추가', () => {
    const out = appendMemoryServed([{ category: 'painful', ts: NOW - 1 * DAY }], 'growth', NOW);
    expect(out.map((e) => e.category)).toEqual(['painful', 'growth']);
  });

  it('추가하면서 만료 항목 정리', () => {
    const out = appendMemoryServed(
      [{ category: 'happy', ts: NOW - 10 * DAY }],
      'miss',
      NOW,
    );
    expect(out.map((e) => e.category)).toEqual(['miss']);
  });

  it('회전 시나리오: painful·growth 답한 뒤엔 둘 다 recent에 잡혀 happy/miss로 회전', () => {
    let entries = appendMemoryServed([], 'painful', NOW - 1 * DAY);
    entries = appendMemoryServed(entries, 'growth', NOW);
    const recent = recentMemoryCategories(entries, NOW);
    expect(recent.sort()).toEqual(['growth', 'painful']);
  });
});
