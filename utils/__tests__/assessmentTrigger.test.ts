import { describe, it, expect } from 'vitest';
import { pickRecommendation } from '@/utils/assessmentTrigger';

const BREAKUP = '2026-04-04T00:00:00Z'; // arbitrary anchor

describe('pickRecommendation — D+7 PHQ9 윈도우', () => {
  it('D+7 + 응답 없음 → PHQ9 권유', () => {
    const r = pickRecommendation(7, BREAKUP, {});
    expect(r?.instrument).toBe('PHQ9');
    expect(r?.source).toBe('d7');
  });

  it('D+6 (윈도우 하한) → PHQ9 권유', () => {
    const r = pickRecommendation(6, BREAKUP, {});
    expect(r?.instrument).toBe('PHQ9');
  });

  it('D+8 (윈도우 상한) → PHQ9 권유', () => {
    const r = pickRecommendation(8, BREAKUP, {});
    expect(r?.instrument).toBe('PHQ9');
  });

  it('D+5 (윈도우 밖) → null', () => {
    const r = pickRecommendation(5, BREAKUP, {});
    expect(r).toBeNull();
  });

  it('D+7 + PHQ9 응답이 onboarding(D+0)뿐 → 권유', () => {
    const r = pickRecommendation(7, BREAKUP, { PHQ9: BREAKUP });
    expect(r?.instrument).toBe('PHQ9');
  });

  it('D+7 + PHQ9 응답이 D+5 (cutoff D+6 미만이라 권유)', () => {
    const fiveDays = new Date(Date.parse(BREAKUP) + 5 * 24 * 3600 * 1000).toISOString();
    const r = pickRecommendation(7, BREAKUP, { PHQ9: fiveDays });
    expect(r?.instrument).toBe('PHQ9');
  });

  it('D+7 + PHQ9 응답이 D+6 정확 → 권유 안 함 (이번 윈도우에 이미 응답)', () => {
    const sixDays = new Date(Date.parse(BREAKUP) + 6 * 24 * 3600 * 1000).toISOString();
    const r = pickRecommendation(7, BREAKUP, { PHQ9: sixDays });
    expect(r).toBeNull();
  });
});

describe('pickRecommendation — D+14 GAD7 윈도우', () => {
  it('D+14 + GAD7 응답 없음 → GAD7 권유', () => {
    const r = pickRecommendation(14, BREAKUP, {});
    expect(r?.instrument).toBe('GAD7');
    expect(r?.source).toBe('d14');
  });

  it('D+13/D+15 boundary → GAD7 권유', () => {
    expect(pickRecommendation(13, BREAKUP, {})?.instrument).toBe('GAD7');
    expect(pickRecommendation(15, BREAKUP, {})?.instrument).toBe('GAD7');
  });
});

describe('pickRecommendation — D+30 RSE 윈도우', () => {
  it('D+30 ± 2 (28~32) → RSE 권유', () => {
    expect(pickRecommendation(28, BREAKUP, {})?.instrument).toBe('RSE');
    expect(pickRecommendation(30, BREAKUP, {})?.instrument).toBe('RSE');
    expect(pickRecommendation(32, BREAKUP, {})?.instrument).toBe('RSE');
  });

  it('D+27 / D+33 → null', () => {
    expect(pickRecommendation(27, BREAKUP, {})).toBeNull();
    expect(pickRecommendation(33, BREAKUP, {})).toBeNull();
  });
});

describe('pickRecommendation — 엣지', () => {
  it('breakupISO null → null', () => {
    expect(pickRecommendation(7, null, {})).toBeNull();
  });

  it('breakupISO 잘못된 포맷 → null', () => {
    expect(pickRecommendation(7, 'not a date', {})).toBeNull();
  });

  it('윈도우 안인데 모든 instrument 응답 최신이면 null', () => {
    const recent = new Date().toISOString();
    expect(
      pickRecommendation(7, BREAKUP, { PHQ9: recent, GAD7: recent, RSE: recent }),
    ).toBeNull();
  });
});
