import { describe, it, expect } from 'vitest';
import { evaluateKnotTrigger, type KnotTriggerInput } from '../knotTrigger';
import { resolvePersona } from '../personaResolver';

function baseInput(overrides: Partial<KnotTriggerInput> = {}): KnotTriggerInput {
  return {
    daysElapsed: 30,
    moodTrend: [4, 5, 5, 4, 5, 6, 5], // 평균 ~4.86
    recent3DaysMood: [5, 6, 5],
    decisionLockUnlocked: true,
    resolved: resolvePersona('P12', null),
    knotCanPrompt: true,
    hour: 14,
    ...overrides,
  };
}

describe('evaluateKnotTrigger — 6조건 AND', () => {
  it('표준 조건 모두 충족 → allowed', () => {
    expect(evaluateKnotTrigger(baseInput())).toEqual({ allowed: true });
  });

  it('비허용 페르소나(P03) → persona_disallowed', () => {
    expect(
      evaluateKnotTrigger(baseInput({ resolved: resolvePersona('P03', null) })),
    ).toEqual({ allowed: false, reason: 'persona_disallowed' });
  });

  it('D+15(임계 미달) → before_d_threshold', () => {
    expect(evaluateKnotTrigger(baseInput({ daysElapsed: 15 }))).toEqual({
      allowed: false,
      reason: 'before_d_threshold',
    });
  });

  it('C-SSRS 잠금 → decision_locked', () => {
    expect(evaluateKnotTrigger(baseInput({ decisionLockUnlocked: false }))).toEqual({
      allowed: false,
      reason: 'decision_locked',
    });
  });

  it('mood 평균 3점 → low_mood', () => {
    expect(
      evaluateKnotTrigger(baseInput({ moodTrend: [2, 3, 3, 2, 3, 4, 4] })),
    ).toEqual({ allowed: false, reason: 'low_mood' });
  });

  it('mood 데이터 부족 → low_mood (안전 default)', () => {
    expect(evaluateKnotTrigger(baseInput({ moodTrend: [] }))).toEqual({
      allowed: false,
      reason: 'low_mood',
    });
  });

  it('최근 3일에 1~2점 존재 → crisis_signal', () => {
    expect(evaluateKnotTrigger(baseInput({ recent3DaysMood: [5, 2, 5] }))).toEqual({
      allowed: false,
      reason: 'crisis_signal',
    });
  });

  it('새벽 2시 진입 → late_night', () => {
    expect(evaluateKnotTrigger(baseInput({ hour: 2 }))).toEqual({
      allowed: false,
      reason: 'late_night',
    });
  });

  it('새벽 5시 진입 → 통과 (5시 정각은 허용)', () => {
    expect(evaluateKnotTrigger(baseInput({ hour: 5 }))).toEqual({ allowed: true });
  });

  it('새벽 0시 진입 → late_night', () => {
    expect(evaluateKnotTrigger(baseInput({ hour: 0 }))).toEqual({
      allowed: false,
      reason: 'late_night',
    });
  });

  it('쿨다운 중(canPrompt=false) → cooldown', () => {
    expect(evaluateKnotTrigger(baseInput({ knotCanPrompt: false }))).toEqual({
      allowed: false,
      reason: 'cooldown',
    });
  });

  it('P20 단절 30일 + D+30 → allowed', () => {
    expect(
      evaluateKnotTrigger(
        baseInput({ resolved: resolvePersona('P20', null), daysElapsed: 30 }),
      ),
    ).toEqual({ allowed: true });
  });

  it('P20 + D+25 → before_d_threshold (30일 단절 미달)', () => {
    expect(
      evaluateKnotTrigger(
        baseInput({ resolved: resolvePersona('P20', null), daysElapsed: 25 }),
      ),
    ).toEqual({ allowed: false, reason: 'before_d_threshold' });
  });

  it('다중 페르소나 — P12 + P19 비허용 → persona_disallowed', () => {
    expect(
      evaluateKnotTrigger(baseInput({ resolved: resolvePersona('P12', 'P19') })),
    ).toEqual({ allowed: false, reason: 'persona_disallowed' });
  });

  it('D+30 정확 boundary → allowed (≥ 비교)', () => {
    expect(evaluateKnotTrigger(baseInput({ daysElapsed: 30 }))).toEqual({ allowed: true });
  });

  it('D+29 → before_d_threshold (D+30 미만)', () => {
    expect(evaluateKnotTrigger(baseInput({ daysElapsed: 29 }))).toEqual({
      allowed: false,
      reason: 'before_d_threshold',
    });
  });

  it('D+31 → allowed', () => {
    expect(evaluateKnotTrigger(baseInput({ daysElapsed: 31 }))).toEqual({ allowed: true });
  });

  it('crisis_override(C-SSRS lockout) 페르소나 → persona_disallowed (triggerAllowed=false)', () => {
    expect(
      evaluateKnotTrigger(
        baseInput({
          resolved: resolvePersona('P12', null, { crisisLockout: true }),
        }),
      ),
    ).toEqual({ allowed: false, reason: 'persona_disallowed' });
  });
});
