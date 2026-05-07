import { describe, it, expect } from 'vitest';
import {
  isInKnotCooldown,
  isPromptedThisCycle,
  KNOT_COOLDOWN_DAYS,
} from '../knotCooldown';

describe('isInKnotCooldown', () => {
  it('declinedAt이 null이면 쿨다운 아님', () => {
    expect(isInKnotCooldown(null)).toBe(false);
  });

  it('잘못된 ISO 문자열이면 false (안전 default)', () => {
    expect(isInKnotCooldown('not-a-date')).toBe(false);
  });

  it('거절 직후 쿨다운 활성', () => {
    const now = new Date('2026-05-07T10:00:00Z');
    const declinedAt = '2026-05-07T09:00:00Z';
    expect(isInKnotCooldown(declinedAt, now)).toBe(true);
  });

  it('쿨다운 마지막 날(D+6.99) 활성', () => {
    const now = new Date('2026-05-13T23:00:00Z');
    const declinedAt = '2026-05-07T00:00:00Z';
    expect(isInKnotCooldown(declinedAt, now)).toBe(true);
  });

  it('쿨다운 정확히 7일 경과 시 비활성', () => {
    const now = new Date('2026-05-14T00:00:00Z');
    const declinedAt = '2026-05-07T00:00:00Z';
    expect(isInKnotCooldown(declinedAt, now)).toBe(false);
  });

  it('커스텀 days 인자 (3일)', () => {
    const now = new Date('2026-05-10T00:00:00Z');
    const declinedAt = '2026-05-07T00:00:00Z';
    expect(isInKnotCooldown(declinedAt, now, 3)).toBe(false);
    expect(isInKnotCooldown(declinedAt, now, 4)).toBe(true);
  });

  it('KNOT_COOLDOWN_DAYS 상수 = 7', () => {
    expect(KNOT_COOLDOWN_DAYS).toBe(7);
  });
});

describe('isPromptedThisCycle', () => {
  it('lastTriggerCycle이 null이면 false', () => {
    expect(isPromptedThisCycle(null, 1)).toBe(false);
  });

  it('cycle 일치 시 true', () => {
    expect(isPromptedThisCycle(2, 2)).toBe(true);
  });

  it('cycle 불일치 시 false (다음 cycle은 새 발화 가능)', () => {
    expect(isPromptedThisCycle(1, 2)).toBe(false);
  });
});
