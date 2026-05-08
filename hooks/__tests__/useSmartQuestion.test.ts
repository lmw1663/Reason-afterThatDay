// Phase C — useSmartQuestion 파이프라인 회귀.
// 순수 함수 단계만 테스트 (hook 자체는 store integration). Phase D 추가 단계가
// 끼어들 때 우선순위 회귀를 빠르게 잡기 위한 1차 안전망.

import { describe, it, expect } from 'vitest';
import {
  isInCooldown,
  selectDirectionChange,
  selectDirectionSteady,
  scoreCandidate,
  selectByGeneralScore,
  COOLDOWN_MS,
} from '@/hooks/useSmartQuestion';
import type { Question, AnsweredQuestion } from '@/store/useQuestionStore';

const POOL: Question[] = [
  { id: 'j_direction_change', text: '뭐가 마음을 바꿨어?',     context: ['journal'],  isActive: true,  weight: 10, category: 'direction', allowCooldownBypass: true },
  { id: 'j_direction_steady', text: '이 마음이 단단해 보여',    context: ['journal'],  isActive: true,  weight: 8,  category: 'direction', allowCooldownBypass: true },
  { id: 'j_today_mood',       text: '오늘 어떤 순간이?',         context: ['journal'],  isActive: true,  weight: 5 },
  { id: 'j_miss_what',        text: '가장 그리운 게?',           context: ['journal'],  isActive: true,  weight: 5 },
  { id: 'a_breakup_reason',   text: '헤어진 이유?',              context: ['analysis'], isActive: true,  weight: 7 },
  { id: 'a_their_feeling',    text: '상대 마음은?',              context: ['analysis'], isActive: true,  weight: 5 },
  { id: 'inactive_q',         text: '비활성',                    context: ['journal'],  isActive: false, weight: 100 },
];

function answeredAt(updatedAt: string, status: AnsweredQuestion['status'] = 'answered'): AnsweredQuestion {
  return { questionId: 'x', responseValue: 'v', status, updatedAt };
}

// ------------------------------------------------------------
// isInCooldown
// ------------------------------------------------------------
describe('isInCooldown', () => {
  const now = new Date('2026-05-08T12:00:00Z').getTime();

  it('answered=undefined → false', () => {
    expect(isInCooldown(undefined, now)).toBe(false);
  });
  it('1시간 전 답변 → true (72h 미만)', () => {
    const a = answeredAt(new Date(now - 3600_000).toISOString());
    expect(isInCooldown(a, now)).toBe(true);
  });
  it('72시간 정확히 → false (cap 동작 — 미만만 true)', () => {
    const a = answeredAt(new Date(now - COOLDOWN_MS).toISOString());
    expect(isInCooldown(a, now)).toBe(false);
  });
  it('80시간 전 → false', () => {
    const a = answeredAt(new Date(now - 80 * 3600_000).toISOString());
    expect(isInCooldown(a, now)).toBe(false);
  });
});

// ------------------------------------------------------------
// selectDirectionChange
// ------------------------------------------------------------
describe('selectDirectionChange', () => {
  it('prevDirection null → null', () => {
    expect(selectDirectionChange(POOL, null, 'catch')).toBeNull();
  });
  it('같은 방향 → null', () => {
    expect(selectDirectionChange(POOL, 'catch', 'catch')).toBeNull();
  });
  it('다른 방향 → j_direction_change 풀 row 반환', () => {
    const q = selectDirectionChange(POOL, 'catch', 'let_go');
    expect(q?.id).toBe('j_direction_change');
    expect(q?.category).toBe('direction'); // 풀의 v2 메타까지 흘러옴
  });
  it('풀에 j_direction_change 없으면 폴백 사용', () => {
    const q = selectDirectionChange([], 'catch', 'let_go');
    expect(q?.id).toBe('j_direction_change');
    expect(q?.text).toBe('뭐가 마음을 바꿨어?');
  });
});

// ------------------------------------------------------------
// selectDirectionSteady
// ------------------------------------------------------------
describe('selectDirectionSteady', () => {
  it('3개 미만 → null', () => {
    expect(selectDirectionSteady(POOL, ['catch', 'catch'], 'catch')).toBeNull();
  });
  it('3개 모두 같은 방향 → j_direction_steady', () => {
    const q = selectDirectionSteady(POOL, ['catch', 'catch', 'catch'], 'catch');
    expect(q?.id).toBe('j_direction_steady');
  });
  it('하나라도 다르면 null', () => {
    expect(selectDirectionSteady(POOL, ['catch', 'let_go', 'catch'], 'catch')).toBeNull();
  });
  it('현재 방향과 다른 3연속도 null (현재 vs 누적이 일치해야 함)', () => {
    expect(selectDirectionSteady(POOL, ['catch', 'catch', 'catch'], 'let_go')).toBeNull();
  });
});

// ------------------------------------------------------------
// scoreCandidate
// ------------------------------------------------------------
describe('scoreCandidate', () => {
  const q: Question = POOL.find((x) => x.id === 'j_today_mood')!; // weight=5

  it('미답변 → weight + 5', () => {
    expect(scoreCandidate(q, {}, null)).toBe(10);
  });
  it('answered → weight 만 (가산점 없음)', () => {
    const answered = { j_today_mood: answeredAt('2026-05-08T00:00:00Z', 'answered') };
    expect(scoreCandidate(q, answered, null)).toBe(5);
  });
  it('re_ask → weight + 3', () => {
    const answered = { j_today_mood: answeredAt('2026-05-08T00:00:00Z', 're_ask') };
    expect(scoreCandidate(q, answered, null)).toBe(8);
  });
  it('페르소나 부스터 적용 (P05 + j_decision_recall)', () => {
    const target: Question = { id: 'j_decision_recall', text: 't', context: ['journal'], isActive: true, weight: 2 };
    expect(scoreCandidate(target, {}, 'P05')).toBe(2 + 5 + 20); // weight + 미답변 + booster
  });
});

// ------------------------------------------------------------
// selectByGeneralScore
// ------------------------------------------------------------
describe('selectByGeneralScore', () => {
  const now = new Date('2026-05-08T12:00:00Z').getTime();

  it('context 매칭 + 활성만 후보', () => {
    const q = selectByGeneralScore(POOL, 'journal', {}, null, now);
    // weight 10 (j_direction_change) + 5 미답변 = 15. 가장 높음.
    // 단 inactive_q (weight=100)는 제외됨
    expect(q?.id).toBe('j_direction_change');
  });
  it('inactive 질문 제외 (weight 100 인데도)', () => {
    const list = [...POOL]; // 내부 inactive_q 포함
    const q = selectByGeneralScore(list, 'journal', {}, null, now);
    expect(q?.id).not.toBe('inactive_q');
  });
  it('cooldown 내 질문 제외', () => {
    // j_direction_change 만 답변 + 1시간 전 → 쿨다운 → j_direction_steady (weight 8 + 5) 가 우승
    const answered = {
      j_direction_change: answeredAt(new Date(now - 3600_000).toISOString()),
    };
    const q = selectByGeneralScore(POOL, 'journal', answered, null, now);
    expect(q?.id).toBe('j_direction_steady');
  });
  it('persona 차단 적용 (P14 + a_their_feeling)', () => {
    // P14 는 a_their_feeling, a_fix_possible 차단 → a_breakup_reason 만 남음
    const q = selectByGeneralScore(POOL, 'analysis', {}, 'P14', now);
    expect(q?.id).toBe('a_breakup_reason');
  });
  it('아무 후보도 없으면 null', () => {
    expect(selectByGeneralScore([], 'journal', {}, null, now)).toBeNull();
  });
});
