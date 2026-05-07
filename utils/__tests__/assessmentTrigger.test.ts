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

describe('pickRecommendation — Phase H 단축형 양성 강화', () => {
  it('D+7 PHQ9 + PHQ-2 양성 → 강화 카피', () => {
    const r = pickRecommendation(7, BREAKUP, {}, { phq2: true });
    expect(r?.instrument).toBe('PHQ9');
    expect(r?.isShortFormPositive).toBe(true);
    expect(r?.cardTitle).toBe('지난번 결을 좀 더 자세히 봐도 좋을 시기야');
    expect(r?.cardSubtitle).toBe('9문항으로 마음의 결을 더 깊게 잡아볼래');
  });

  it('D+7 PHQ9 + PHQ-2 음성 → 표준 카피', () => {
    const r = pickRecommendation(7, BREAKUP, {}, { phq2: false });
    expect(r?.cardTitle).toBe('오늘 마음 점검 같이 해볼래?');
    expect(r?.isShortFormPositive).toBeUndefined();
  });

  it('D+14 GAD7 + GAD-2 양성 → 강화 카피', () => {
    const r = pickRecommendation(14, BREAKUP, {}, { gad2: true });
    expect(r?.instrument).toBe('GAD7');
    expect(r?.isShortFormPositive).toBe(true);
    expect(r?.cardTitle).toBe('조마조마함의 결을 더 들여다봐도 좋아');
  });

  it('D+7 PHQ9 + GAD-2 양성만 → PHQ9 표준 카피 (instrument-축 매칭 필요)', () => {
    const r = pickRecommendation(7, BREAKUP, {}, { phq2: false, gad2: true });
    expect(r?.instrument).toBe('PHQ9');
    expect(r?.cardTitle).toBe('오늘 마음 점검 같이 해볼래?');
    expect(r?.isShortFormPositive).toBeUndefined();
  });

  it('D+30 RSE + 어떤 양성이든 → RSE 표준 카피 (단축형과 무관)', () => {
    const r = pickRecommendation(30, BREAKUP, {}, { phq2: true, gad2: true });
    expect(r?.instrument).toBe('RSE');
    expect(r?.cardTitle).toBe('나에 대한 빛, 지금은 어때?');
    expect(r?.isShortFormPositive).toBeUndefined();
  });

  it('shortFormPositive 미전달 → 기존 시그니처 호환', () => {
    const r = pickRecommendation(7, BREAKUP, {});
    expect(r?.instrument).toBe('PHQ9');
    expect(r?.cardTitle).toBe('오늘 마음 점검 같이 해볼래?');
  });
});
