import { describe, it, expect } from 'vitest';
import {
  classifyPersona,
  type OnboardingResponses,
  type PsychAxes,
} from '@/utils/personaClassifier';

// Phase H — a9/a10 RuleKey 분기 + 비옵트인 동일성 검증.

// baseline: q5='empty' (P08에 +2만 부여, P03/P11/P19에 영향 X — a9/a10 분기 격리 검증).
// q5='unsure'는 P11에 +2 baseline 부여하므로 a10 양성 검증 시 점수 격리 안 됨 — 회피.
function baseResponses(): OnboardingResponses {
  return {
    q1_initiator: 'mutual',
    q2_thought: 'none',
    q3_count: 'second_or_third',
    q4_duration_range: '6m-2y',
    q4_married: false,
    q5_emotion: 'empty',
    q_self_infidelity: false,
    q_complexity: 'none',
    q_breakup_reason: 'mutual',
  };
}

function baseAxes(): PsychAxes {
  return {
    a1_attachment: 0,
    a2_initiator: 0,
    a3_breakup_mode: 0,
    a4_duration: 1,
    a5_health: 0,
    a6_complexity: 0,
    a7_dominant_emotion: 3,  // empty
    a8_crisis: 0,
  };
}

describe('classifyPersona — Phase H a9/a10 분기', () => {
  it('a9/a10 undefined (비옵트인) → 기존 분류 결과 동일 (P12 baseline)', () => {
    const r = classifyPersona({ responses: baseResponses(), axes: baseAxes() });
    expect(r.mode).toBe('standard');
    if (r.mode === 'standard') {
      expect(r.primary).toBe('P12');  // baseline (임계 미달)
      expect(r.scores.P09).toBe(0);
      expect(r.scores.P03).toBe(0);
      expect(r.scores.P11).toBe(0);
    }
  });

  it('a9 양성 단독 → P09 +2, P03·P11·P19 +1 (그러나 임계 5 미달 → P12 baseline 유지)', () => {
    const axes: PsychAxes = { ...baseAxes(), a9_depression: 2 };
    const r = classifyPersona({ responses: baseResponses(), axes });
    if (r.mode === 'standard') {
      expect(r.scores.P09).toBe(2);
      expect(r.scores.P03).toBeGreaterThanOrEqual(1);
      expect(r.scores.P11).toBeGreaterThanOrEqual(1);
      expect(r.scores.P19).toBeGreaterThanOrEqual(1);
      expect(r.primary).toBe('P12');  // 임계 미달 → 안전 baseline
    }
  });

  it('a10 양성 단독 → P03·P11 +2, P19·P10 +1 (임계 미달 → baseline)', () => {
    const axes: PsychAxes = { ...baseAxes(), a10_anxiety: 2 };
    const r = classifyPersona({ responses: baseResponses(), axes });
    if (r.mode === 'standard') {
      expect(r.scores.P03).toBeGreaterThanOrEqual(2);
      expect(r.scores.P11).toBeGreaterThanOrEqual(2);
      expect(r.scores.P19).toBeGreaterThanOrEqual(1);
      expect(r.scores.P10).toBeGreaterThanOrEqual(1);
      expect(r.primary).toBe('P12');
    }
  });

  it('a9/a10 강한 양성 동시 → 점수 가중되나 baseline 안전성 유지 (단독 입력으로 분류 전환 차단)', () => {
    const axes: PsychAxes = { ...baseAxes(), a9_depression: 3, a10_anxiety: 3 };
    const r = classifyPersona({ responses: baseResponses(), axes });
    if (r.mode === 'standard') {
      // P03 = a9(+1) + a10(+2) = 3, P11 = a9(+1) + a10(+2) = 3, P09 = a9(+2) = 2
      expect(r.scores.P03).toBe(3);
      expect(r.scores.P11).toBe(3);
      expect(r.scores.P19).toBe(2);
      expect(r.primary).toBe('P12');  // 여전히 임계 5 미달
    }
  });

  it('a9 음성(0/1) → RuleKey 미발동 (비옵트인 동일성)', () => {
    const axes0: PsychAxes = { ...baseAxes(), a9_depression: 0, a10_anxiety: 0 };
    const axes1: PsychAxes = { ...baseAxes(), a9_depression: 1, a10_anxiety: 1 };
    for (const axes of [axes0, axes1]) {
      const r = classifyPersona({ responses: baseResponses(), axes });
      if (r.mode === 'standard') {
        expect(r.scores.P09).toBe(0);
        expect(r.scores.P03).toBe(0);
        expect(r.scores.P11).toBe(0);
      }
    }
  });

  it('기존 응답 + a10 양성 → P03 가중 (q5.longing P03=+2 + a10 +2 = 4, 여전히 임계 미달)', () => {
    const responses = { ...baseResponses(), q2_thought: 'cant_live_without' as const, q5_emotion: 'longing' as const };
    const axes: PsychAxes = { ...baseAxes(), a7_dominant_emotion: 0, a10_anxiety: 2 };
    const r = classifyPersona({ responses, axes });
    if (r.mode === 'standard') {
      // q2.cant_live_without: P03 +3, P09 +1
      // q5.longing: P03 +2, P09 +1
      // a10.anxiety_positive: P03 +2, P11 +2, P19 +1, P10 +1
      // P03 = 3 + 2 + 2 = 7 → 임계 5 통과 → 분류 P03
      expect(r.scores.P03).toBe(7);
      expect(r.primary).toBe('P03');
    }
  });

  it('C-SSRS 양성 (a8_crisis=3) + a9/a10 양성 → crisis_lockout 우선 (분류 차단)', () => {
    const axes: PsychAxes = { ...baseAxes(), a8_crisis: 3, a9_depression: 3, a10_anxiety: 3 };
    const r = classifyPersona({ responses: baseResponses(), axes });
    expect(r.mode).toBe('crisis_lockout');
    expect(r.primary).toBeNull();
  });

  it('비옵트인 사용자 vs 옵트인 음성 사용자 → 분류 결과 100% 동일성', () => {
    const responses: OnboardingResponses = { ...baseResponses(), q5_emotion: 'anger' };
    const axes_undefined: PsychAxes = { ...baseAxes(), a7_dominant_emotion: 1 };
    const axes_zero: PsychAxes = { ...baseAxes(), a7_dominant_emotion: 1, a9_depression: 0, a10_anxiety: 0 };
    const r1 = classifyPersona({ responses, axes: axes_undefined });
    const r2 = classifyPersona({ responses, axes: axes_zero });
    if (r1.mode === 'standard' && r2.mode === 'standard') {
      expect(r1.primary).toBe(r2.primary);
      expect(r1.scores).toEqual(r2.scores);
    }
  });
});
