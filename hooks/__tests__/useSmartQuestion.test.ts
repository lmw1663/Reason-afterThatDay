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
  selectAnswerChangedFollowUp,
  selectScheduledFollowUp,
  selectScheduledRevisit,
  countTodayFollowUpAnswers,
  selectSmartQuestion,
  COOLDOWN_MS,
} from '@/hooks/useSmartQuestion';
import type { Question, AnsweredQuestion, QuestionFollowup } from '@/store/useQuestionStore';
import type { Direction } from '@/store/useJournalStore';

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

// ------------------------------------------------------------
// Phase D — selectAnswerChangedFollowUp
// ------------------------------------------------------------
const HOUR = 60 * 60 * 1000;

const PD_POOL: Question[] = [
  { id: 'a_breakup_reason', text: '헤어진 이유', context: ['analysis'],            isActive: true, weight: 7, category: 'reason' },
  { id: 'a_fix_possible',   text: '고칠 수 있어?', context: ['analysis'],          isActive: true, weight: 5, category: 'cons' },
  { id: 'a_their_feeling',  text: '상대 마음',    context: ['analysis'],            isActive: true, weight: 5 },
  { id: 'j_direction_change', text: '마음 변화',  context: ['journal'],             isActive: true, weight: 10 },
  { id: 'c_check_change',   text: '바뀔까?',      context: ['compass'],             isActive: true, weight: 7, category: 'fear' },
  { id: 'c_honest_want',    text: '솔직하게',     context: ['compass'],             isActive: true, weight: 9, category: 'direction' },
  { id: 'c_check_fear',     text: '두려움?',      context: ['compass'],             isActive: true, weight: 7, category: 'fear' },
];

const FOLLOWUPS: QuestionFollowup[] = [
  { id: 'fu1', parentId: 'a_breakup_reason',   childId: 'a_fix_possible',  triggerType: 'answer_changed', triggerValue: null, delayHours: 0,  priority: 9 },
  { id: 'fu2', parentId: 'j_direction_change', childId: 'c_check_change',  triggerType: 'always',         triggerValue: null, delayHours: 24, priority: 8 },
  { id: 'fu3', parentId: 'c_honest_want',      childId: 'c_check_fear',    triggerType: 'always',         triggerValue: null, delayHours: 24, priority: 7 },
];

describe('selectAnswerChangedFollowUp', () => {
  const now = new Date('2026-05-08T12:00:00Z').getTime();

  it('parent 미답변 → null', () => {
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, {}, 'analysis', null, now)).toBeNull();
  });

  it('parent 답변 있지만 previousValue null (첫 답변) → null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: '대화 줄음',
        previousValue: undefined, status: 'answered' as const,
        updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'analysis', null, now)).toBeNull();
  });

  it('parent 답변 변경 + 자식 미답변 → 자식 반환 (a_fix_possible)', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: '서로 바빴어',
        previousValue: '대화가 줄었어', status: 'answered' as const,
        updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    const q = selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'analysis', null, now);
    expect(q?.id).toBe('a_fix_possible');
  });

  it('변경이 72h 보다 오래됐으면 null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered' as const, updatedAt: new Date(now - 80 * HOUR).toISOString(),
      },
    };
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'analysis', null, now)).toBeNull();
  });

  it('자식 context 와 현재 context 안 맞으면 null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered' as const, updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    // a_fix_possible 은 analysis context — journal 호출 시 미매칭
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'journal', null, now)).toBeNull();
  });

  it('persona P14 차단 (a_fix_possible) → null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered' as const, updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'analysis', 'P14', now)).toBeNull();
  });

  it('자식이 부모 변경 후에 이미 답변됐으면 → null (중복 회피)', () => {
    const parentAt = now - 5 * HOUR;
    const childAt = now - 1 * HOUR; // 부모 변경 *후*
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered' as const, updatedAt: new Date(parentAt).toISOString(),
      },
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: '응', status: 'answered' as const,
        updatedAt: new Date(childAt).toISOString(),
      },
    };
    expect(selectAnswerChangedFollowUp(PD_POOL, FOLLOWUPS, answered, 'analysis', null, now)).toBeNull();
  });
});

// ------------------------------------------------------------
// Phase D — selectScheduledFollowUp
// ------------------------------------------------------------
describe('selectScheduledFollowUp', () => {
  const now = new Date('2026-05-08T12:00:00Z').getTime();

  it('parent 미답변 → null', () => {
    expect(selectScheduledFollowUp(PD_POOL, FOLLOWUPS, {}, 'compass', null, now)).toBeNull();
  });

  it('delay 미충족 (12h 만 지남, 24h 필요) → null', () => {
    const answered = {
      j_direction_change: {
        questionId: 'j_direction_change', responseValue: 'catch',
        status: 'answered' as const, updatedAt: new Date(now - 12 * HOUR).toISOString(),
      },
    };
    expect(selectScheduledFollowUp(PD_POOL, FOLLOWUPS, answered, 'compass', null, now)).toBeNull();
  });

  it('delay 충족 (25h 지남) + compass 진입 → c_check_change', () => {
    const answered = {
      j_direction_change: {
        questionId: 'j_direction_change', responseValue: 'catch',
        status: 'answered' as const, updatedAt: new Date(now - 25 * HOUR).toISOString(),
      },
    };
    const q = selectScheduledFollowUp(PD_POOL, FOLLOWUPS, answered, 'compass', null, now);
    expect(q?.id).toBe('c_check_change');
  });

  it('window 만료 (delay+8d) → null', () => {
    const answered = {
      j_direction_change: {
        questionId: 'j_direction_change', responseValue: 'catch',
        status: 'answered' as const,
        updatedAt: new Date(now - (24 + 8 * 24) * HOUR).toISOString(),
      },
    };
    expect(selectScheduledFollowUp(PD_POOL, FOLLOWUPS, answered, 'compass', null, now)).toBeNull();
  });

  it('우선순위 — 두 부모 모두 매칭되면 priority 높은 follow-up 우승', () => {
    // fu2 priority=8 (j_direction_change → c_check_change)
    // fu3 priority=7 (c_honest_want → c_check_fear)
    const answered = {
      j_direction_change: {
        questionId: 'j_direction_change', responseValue: 'x',
        status: 'answered' as const, updatedAt: new Date(now - 25 * HOUR).toISOString(),
      },
      c_honest_want: {
        questionId: 'c_honest_want', responseValue: 'x',
        status: 'answered' as const, updatedAt: new Date(now - 25 * HOUR).toISOString(),
      },
    };
    const q = selectScheduledFollowUp(PD_POOL, FOLLOWUPS, answered, 'compass', null, now);
    expect(q?.id).toBe('c_check_change');
  });
});

// ------------------------------------------------------------
// Phase D — countTodayFollowUpAnswers (일일 상한 가드)
// ------------------------------------------------------------
describe('countTodayFollowUpAnswers', () => {
  // KST 기준 — now 는 2026-05-08 KST 16:00 = UTC 07:00
  const now = new Date('2026-05-08T07:00:00Z').getTime();
  // KST 자정 이후 (오늘 KST 10:00) = UTC 01:00
  const todayMorning = new Date('2026-05-08T01:00:00Z').toISOString();
  // 어제 KST 22:00 = UTC 13:00 전날 — KST day boundary 밖
  const yesterday = new Date('2026-05-07T13:00:00Z').toISOString();

  it('KST 자정 이후 자식 답변 1개 → 1', () => {
    const answered = {
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: 'y',
        status: 'answered' as const, updatedAt: todayMorning,
      },
    };
    expect(countTodayFollowUpAnswers(FOLLOWUPS, answered, now)).toBe(1);
  });

  it('어제 답변은 카운트 안 함', () => {
    const answered = {
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: 'y',
        status: 'answered' as const, updatedAt: yesterday,
      },
    };
    expect(countTodayFollowUpAnswers(FOLLOWUPS, answered, now)).toBe(0);
  });

  it('자식이 아닌 질문 답변은 카운트 안 함', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'y',
        status: 'answered' as const, updatedAt: todayMorning,
      },
    };
    expect(countTodayFollowUpAnswers(FOLLOWUPS, answered, now)).toBe(0);
  });

  it('shown 상태는 카운트 안 함', () => {
    const answered = {
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: null,
        status: 'shown' as const, updatedAt: todayMorning,
      },
    };
    expect(countTodayFollowUpAnswers(FOLLOWUPS, answered, now)).toBe(0);
  });
});

// ------------------------------------------------------------
// Phase E — selectScheduledRevisit (D+N 자기참조 재질문)
// ------------------------------------------------------------
const DAY = 24 * HOUR;

const PE_POOL: Question[] = [
  // revisit 7d (window 3d)
  { id: 'a_breakup_reason', text: '헤어진 이유',  context: ['analysis'], isActive: true, weight: 7,
    revisitAfterDays: 7, revisitWindowDays: 3 },
  // revisit 30d (window 5d)
  { id: 'g_regret_best',    text: '아쉬운 기억', context: ['graduation'], isActive: true, weight: 8,
    revisitAfterDays: 30, revisitWindowDays: 5 },
  // 다른 context — analysis 호출 시 미매칭
  { id: 'g_learned',        text: '배운 점',    context: ['graduation'], isActive: true, weight: 8,
    revisitAfterDays: 30, revisitWindowDays: 5 },
  // revisit 미설정 — 후보 안 됨
  { id: 'a_their_feeling',  text: '상대 마음',  context: ['analysis'], isActive: true, weight: 5 },
];

describe('selectScheduledRevisit', () => {
  const now = new Date('2026-05-08T12:00:00Z').getTime();

  it('답변 안 한 질문 → null', () => {
    expect(selectScheduledRevisit(PE_POOL, {}, 'analysis', null, now)).toBeNull();
  });

  it('답변 직후 (D+0) → null (아직 due 미충족)', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    expect(selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now)).toBeNull();
  });

  it('D+7 정확히 (window 시작) → 후보', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 7 * DAY).toISOString(),
      },
    };
    const q = selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now);
    expect(q?.id).toBe('a_breakup_reason');
  });

  it('D+9 (window 7+3 안) → 후보', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 9 * DAY).toISOString(),
      },
    };
    const q = selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now);
    expect(q?.id).toBe('a_breakup_reason');
  });

  it('D+11 (window 7+3 초과) → null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 11 * DAY).toISOString(),
      },
    };
    expect(selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now)).toBeNull();
  });

  it('context 미일치 → null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 7 * DAY).toISOString(),
      },
    };
    // graduation context 진입 — a_breakup_reason 은 analysis 라 미매칭
    expect(selectScheduledRevisit(PE_POOL, answered, 'graduation', null, now)).toBeNull();
  });

  it('shown 상태 (답변 미완료) → null', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: null,
        status: 'shown' as const, updatedAt: new Date(now - 7 * DAY).toISOString(),
      },
    };
    expect(selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now)).toBeNull();
  });

  it('매듭 비허용 페르소나(P03) + graduation context → null (선제 가드)', () => {
    const answered = {
      g_regret_best: {
        questionId: 'g_regret_best', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 31 * DAY).toISOString(),
      },
    };
    expect(selectScheduledRevisit(PE_POOL, answered, 'graduation', 'P03', now)).toBeNull();
    expect(selectScheduledRevisit(PE_POOL, answered, 'graduation', 'P11', now)).toBeNull();
    expect(selectScheduledRevisit(PE_POOL, answered, 'graduation', 'P16', now)).toBeNull();
    expect(selectScheduledRevisit(PE_POOL, answered, 'graduation', 'P19', now)).toBeNull();
    // 비차단 페르소나 (예: P05) 는 정상 후보
    const q = selectScheduledRevisit(PE_POOL, answered, 'graduation', 'P05', now);
    expect(q?.id).toBe('g_regret_best');
  });

  it('두 후보 모두 due → 가장 오래된 응답이 우선', () => {
    const answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 8 * DAY).toISOString(),
      },
      g_regret_best: {
        questionId: 'g_regret_best', responseValue: 'v',
        status: 'answered' as const, updatedAt: new Date(now - 33 * DAY).toISOString(),
      },
    };
    // analysis context — a_breakup_reason 만 매칭. g_regret_best 는 graduation context.
    const q = selectScheduledRevisit(PE_POOL, answered, 'analysis', null, now);
    expect(q?.id).toBe('a_breakup_reason');
  });
});

// ------------------------------------------------------------
// Phase D — selectSmartQuestion 통합 우선순위 회귀
// ------------------------------------------------------------
describe('selectSmartQuestion 우선순위 통합', () => {
  const now = new Date('2026-05-08T07:00:00Z').getTime(); // KST 16:00

  function baseArgs(): Parameters<typeof selectSmartQuestion>[0] {
    return {
      pool: PD_POOL,
      followups: FOLLOWUPS,
      answered: {},
      context: 'analysis',
      currentDirection: 'undecided',
      prevDirection: null,
      recentDirections: [],
      persona: null,
      now,
    };
  }

  it('방향 변화 + 답변 변화 동시 매칭 → direction_change 우승', () => {
    const args = baseArgs();
    args.context = 'journal';
    args.prevDirection = 'catch';
    args.currentDirection = 'let_go';
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered', updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('direction_change');
  });

  it('답변 변화 + 일반 점수 동시 → follow_up 우승 (analysis context)', () => {
    const args = baseArgs();
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered', updatedAt: new Date(now - HOUR).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('follow_up');
    expect(r?.question.id).toBe('a_fix_possible');
  });

  it('오늘 후속 자식 답변이 이미 1건 → 후속 단계 스킵, 일반 점수로 폴백', () => {
    const args = baseArgs();
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v', previousValue: 'old',
        status: 'answered', updatedAt: new Date(now - HOUR).toISOString(),
      },
      // 오늘 KST 자정 이후 자식 답변 1건 (일반 흐름이든 후속이든)
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: 'y',
        status: 'answered', updatedAt: new Date(now - 2 * HOUR).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('general'); // follow_up 단계 스킵
  });

  it('answer_changed + scheduled 동시 매칭 → answer_changed 우승 (파이프라인 순서)', () => {
    const args = baseArgs();
    args.context = 'compass';
    args.answered = {
      // analysis 답변 변화 — but child a_fix_possible 은 analysis 라 compass 진입에선 미매칭
      // → scheduled 만 남아야 함
      j_direction_change: {
        questionId: 'j_direction_change', responseValue: 'catch',
        status: 'answered', updatedAt: new Date(now - 25 * HOUR).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('follow_up');
    expect(r?.question.id).toBe('c_check_change');
  });

  it('아무 매칭 없음 + 풀에 후보 있음 → general', () => {
    const r = selectSmartQuestion(baseArgs());
    expect(r?.source).toBe('general');
  });

  it('완전 빈 풀 → null', () => {
    const args = baseArgs();
    args.pool = [];
    const r = selectSmartQuestion(args);
    expect(r).toBeNull();
  });

  it('Phase E — D+8 시점 진입 → revisit source 우승', () => {
    const args = baseArgs();
    args.pool = PE_POOL;
    args.context = 'analysis';
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered', updatedAt: new Date(now - 8 * DAY).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('revisit');
    expect(r?.question.id).toBe('a_breakup_reason');
  });

  it('Phase E — answer_changed 와 revisit 동시 매칭 → answer_changed 우승 (파이프라인 순서)', () => {
    const args = baseArgs();
    args.pool = [...PE_POOL, ...PD_POOL.filter((q) => q.id === 'a_fix_possible')];
    args.context = 'analysis';
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'new',
        previousValue: 'old', // answer_changed 트리거
        status: 'answered', updatedAt: new Date(now - HOUR).toISOString(), // 변경은 최근, revisit 안 됨
      },
    };
    // 위 setup 은 revisit 안 됨 (D+0). answer_changed 만 매칭 → follow_up
    const r = selectSmartQuestion(args);
    expect(r?.source).toBe('follow_up');
  });

  it('Phase E — 오늘 follow-up 자식 답 → revisit 도 스킵 (보수적 일일 상한)', () => {
    const args = baseArgs();
    args.pool = PE_POOL;
    args.context = 'analysis';
    args.answered = {
      a_breakup_reason: {
        questionId: 'a_breakup_reason', responseValue: 'v',
        status: 'answered', updatedAt: new Date(now - 8 * DAY).toISOString(),
      },
      // 오늘 follow-up 자식이 답변됨
      a_fix_possible: {
        questionId: 'a_fix_possible', responseValue: 'y',
        status: 'answered', updatedAt: new Date(now - 2 * HOUR).toISOString(),
      },
    };
    const r = selectSmartQuestion(args);
    // revisit 단계 스킵 → general 폴백 (a_fix_possible 은 PE_POOL 에 없음, a_their_feeling 우승)
    expect(r?.source).toBe('general');
  });
});
