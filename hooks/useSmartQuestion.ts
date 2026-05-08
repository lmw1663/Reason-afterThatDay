// Phase C — useSmartQuestion 파이프라인 분해
// Phase D — 후속 트리거 단계 추가 (selectAnswerChangedFollowUp / selectScheduledFollowUp)
//
// 변경 전: 단일 함수 안에서 방향 변화·연속·일반 점수 분기를 모두 수행.
// 변경 후: 순수 함수 단계로 분리 → 단위 테스트 + Phase D 후속 트리거 단계 추가.
//
// 우선순위 (위 → 아래, 첫 매칭만 반환):
//   1. selectDirectionChange       — 어제 ↔ 오늘 방향 다름
//   2. selectAnswerChangedFollowUp — 부모 응답이 *바뀌면* 자식 질문 (Phase D)
//   3. selectScheduledFollowUp     — 부모 응답 후 N시간 경과 (Phase D)
//   4. selectDirectionSteady       — 3일 연속 같은 방향
//   5. selectByGeneralScore        — 컨텍스트 매칭 + 페르소나 부스터/차단 + 쿨다운
//
// 후속(2·3) 발화 상한: 하루 1개. 이미 오늘 후속 자식 질문에 답한 사용자에게는
// 후속 단계를 건너뛰고 4·5로 폴백 — 압박감 회피 (CLAUDE.md "단정 금지").
//
// ─────────────────────────────────────────────────────────────────────
// 의도적 제외 (Phase G/E 통합 예정):
//   · C-SSRS 양성 잠금 — `safety_lockouts.decision_locked / graduation_locked`
//     체크는 hook 진입부 *위*(question 단계가 아니라 hook 자체)에서 가드
//   · 매듭 권유 비허용 페르소나(P03/P11/P16/P19) — graduation context 질문이
//     `selectScheduledRevisit` 로 끌려나올 때 카테고리·context 차원 차단 필요
//   · 시간차 *재질문*(`revisit_after_days` 컬럼 기반 자기참조) — Phase E 에서
//     별도 단계로 추가. 본 파일의 selectScheduledFollowUp 은 followups 테이블의
//     `always + delay_hours > 0` 패턴 한정.
// ─────────────────────────────────────────────────────────────────────

import {
  useQuestionStore,
  type Question,
  type QuestionContext,
  type AnsweredQuestion,
  type QuestionFollowup,
} from '@/store/useQuestionStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getQuestionBooster,
  isQuestionBlocked,
} from '@/constants/personaQuestionWeights';
import type { PersonaCode } from '@/utils/personaClassifier';

const DIRECTION_CHANGE_FALLBACK: Question = {
  id: 'j_direction_change',
  text: '뭐가 마음을 바꿨어?',
  context: ['journal'],
  isActive: true,
  weight: 10,
};

const DIRECTION_STEADY_FALLBACK: Question = {
  id: 'j_direction_steady',
  text: '이 마음이 꽤 단단해 보여. 어디서 온 걸까?',
  context: ['journal'],
  isActive: true,
  weight: 8,
};

export const COOLDOWN_MS = 72 * 60 * 60 * 1000; // 72시간
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// 답변 변화 후속이 *최근* 변화에만 반응하도록 — 너무 오래된 변경은 의도적으로 무시
const ANSWER_CHANGED_WINDOW_MS = 72 * HOUR_MS;
// 시간차 후속의 만료 — delay_hours 후에도 7일 안에 사용자가 진입해야 발화
const SCHEDULED_FOLLOWUP_WINDOW_MS = 7 * DAY_MS;

export type SmartQuestionSource =
  | 'direction_change'
  | 'direction_steady'
  | 'follow_up'
  | 'general';

export interface SmartQuestionResult {
  question: Question;
  source: SmartQuestionSource;
}

function pickFromPool(pool: Question[], id: string, fallback: Question): Question {
  return pool.find((q) => q.id === id) ?? fallback;
}

// ============================================================
// Pure pipeline 단계들
// ============================================================

export function isInCooldown(
  answered: Pick<AnsweredQuestion, 'updatedAt'> | undefined,
  now: number = Date.now(),
): boolean {
  if (!answered) return false;
  const elapsed = now - new Date(answered.updatedAt).getTime();
  return elapsed < COOLDOWN_MS;
}

// 1) 방향 변화
export function selectDirectionChange(
  pool: Question[],
  prevDirection: Direction | null,
  currentDirection: Direction,
): Question | null {
  if (!prevDirection || prevDirection === currentDirection) return null;
  return pickFromPool(pool, 'j_direction_change', DIRECTION_CHANGE_FALLBACK);
}

// 2) 답변 변화 후속 — 부모 응답이 직전 대비 바뀌었을 때 자식 질문 노출
//
// 발화 조건:
//   · 부모 answered.previousValue 가 not-null (= 한 번 이상 변경)
//   · 부모 updatedAt 이 ANSWER_CHANGED_WINDOW_MS (72h) 내
//   · 자식이 현재 context 에 속하고 활성 + 페르소나 차단 통과
//   · 자식이 부모 변경 *후*에 응답되지 않았을 것 (이미 다뤄짐 회피)
//
// 후속 트리거는 *의도된* 재노출이므로 쿨다운 면제. v2 §4 "유기적 연결" 핵심.
export function selectAnswerChangedFollowUp(
  pool: Question[],
  followups: QuestionFollowup[],
  answered: Record<string, AnsweredQuestion | undefined>,
  context: QuestionContext,
  persona: PersonaCode | null,
  now: number = Date.now(),
): Question | null {
  type Candidate = { followup: QuestionFollowup; child: Question; parentChangedAt: number };
  const candidates: Candidate[] = [];

  for (const fu of followups) {
    if (fu.triggerType !== 'answer_changed') continue;
    const parent = answered[fu.parentId];
    if (!parent || parent.previousValue == null) continue;

    const changedAt = new Date(parent.updatedAt).getTime();
    if (now - changedAt > ANSWER_CHANGED_WINDOW_MS) continue;

    const child = pool.find((q) => q.id === fu.childId);
    if (!child || !child.isActive) continue;
    if (!child.context.includes(context)) continue;
    if (isQuestionBlocked(persona, child.id)) continue;

    // 부모 변경 *후*에 자식이 답변됐으면 이미 다뤘다 — 스킵
    const childAnswered = answered[child.id];
    if (childAnswered && childAnswered.status === 'answered') {
      const childAt = new Date(childAnswered.updatedAt).getTime();
      if (childAt > changedAt) continue;
    }

    candidates.push({ followup: fu, child, parentChangedAt: changedAt });
  }

  if (candidates.length === 0) return null;

  // priority desc → 같으면 가장 최근 변경 desc
  candidates.sort((a, b) => {
    const p = b.followup.priority - a.followup.priority;
    return p !== 0 ? p : b.parentChangedAt - a.parentChangedAt;
  });
  return candidates[0].child;
}

// 3) 시간차 후속 — followups.trigger_type='always' + delay_hours > 0
//
// 발화 조건:
//   · 부모가 answered (값 변경 여부 무관)
//   · 부모 updatedAt + delay_hours <= now <= 부모 updatedAt + delay_hours + 7d
//   · 자식이 현재 context + 활성 + 페르소나 차단 통과
//   · 자식이 부모 응답 *후* 답변되지 않았을 것
export function selectScheduledFollowUp(
  pool: Question[],
  followups: QuestionFollowup[],
  answered: Record<string, AnsweredQuestion | undefined>,
  context: QuestionContext,
  persona: PersonaCode | null,
  now: number = Date.now(),
): Question | null {
  type Candidate = { followup: QuestionFollowup; child: Question; dueAt: number };
  const candidates: Candidate[] = [];

  for (const fu of followups) {
    if (fu.triggerType !== 'always') continue;
    if (fu.delayHours <= 0) continue; // delay 0 인 always 는 의미상 즉시 후속 — 본 단계에선 다루지 않음 (Phase E/회로 추후)
    const parent = answered[fu.parentId];
    if (!parent) continue;

    const answeredAt = new Date(parent.updatedAt).getTime();
    const dueAt = answeredAt + fu.delayHours * HOUR_MS;
    if (now < dueAt) continue;
    if (now - dueAt > SCHEDULED_FOLLOWUP_WINDOW_MS) continue;

    const child = pool.find((q) => q.id === fu.childId);
    if (!child || !child.isActive) continue;
    if (!child.context.includes(context)) continue;
    if (isQuestionBlocked(persona, child.id)) continue;

    const childAnswered = answered[child.id];
    if (childAnswered && childAnswered.status === 'answered') {
      const childAt = new Date(childAnswered.updatedAt).getTime();
      if (childAt > answeredAt) continue;
    }

    candidates.push({ followup: fu, child, dueAt });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.followup.priority - a.followup.priority);
  return candidates[0].child;
}

// 4) 3일 연속 동일 방향
export function selectDirectionSteady(
  pool: Question[],
  recentDirections: Direction[],
  currentDirection: Direction,
): Question | null {
  if (recentDirections.length < 3) return null;
  if (!recentDirections.slice(0, 3).every((d) => d === currentDirection)) return null;
  return pickFromPool(pool, 'j_direction_steady', DIRECTION_STEADY_FALLBACK);
}

export function scoreCandidate(
  q: Question,
  answered: Record<string, AnsweredQuestion | undefined>,
  persona: PersonaCode | null,
): number {
  const a = answered[q.id];
  let score = q.weight;
  if (!a) score += 5;
  if (a?.status === 're_ask') score += 3;
  score += getQuestionBooster(persona, q.id);
  return score;
}

// 5) 일반 점수 기반
export function selectByGeneralScore(
  pool: Question[],
  context: QuestionContext,
  answered: Record<string, AnsweredQuestion | undefined>,
  persona: PersonaCode | null,
  now: number = Date.now(),
): Question | null {
  const candidates = pool
    .filter((q) => q.context.includes(context) && q.isActive)
    .filter((q) => !isInCooldown(answered[q.id], now))
    .filter((q) => !isQuestionBlocked(persona, q.id))
    .sort((a, b) => scoreCandidate(b, answered, persona) - scoreCandidate(a, answered, persona));
  return candidates[0] ?? null;
}

// ============================================================
// 후속 일일 상한 — 압박감 회피 (CLAUDE.md "단정 금지" 톤)
//
// KST(UTC+9) 자정 이후, 후속 그래프의 *자식* 질문에 답한 항목 수.
// >= 1 이면 후속 단계(2·3) 스킵 — 일반 풀로 폴백.
// 일기 도메인 day 정의(`journal_entries_user_date_idx` = KST 기준)와 동일 anchor.
// ============================================================
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function countTodayFollowUpAnswers(
  followups: QuestionFollowup[],
  answered: Record<string, AnsweredQuestion | undefined>,
  now: number = Date.now(),
): number {
  const kstDate = new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
  const startMs = new Date(`${kstDate}T00:00:00+09:00`).getTime();

  const childIds = new Set(followups.map((f) => f.childId));
  let count = 0;
  for (const a of Object.values(answered)) {
    if (!a || a.status !== 'answered') continue;
    if (!childIds.has(a.questionId)) continue;
    if (new Date(a.updatedAt).getTime() < startMs) continue;
    count += 1;
  }
  return count;
}

// ============================================================
// 합성된 파이프라인 — 순수 함수. hook 단의 우선순위 회귀를 단위 테스트 직접 가능.
// ============================================================
export interface SelectSmartQuestionArgs {
  pool: Question[];
  followups: QuestionFollowup[];
  answered: Record<string, AnsweredQuestion | undefined>;
  context: QuestionContext;
  currentDirection: Direction;
  prevDirection: Direction | null;
  recentDirections: Direction[];
  persona: PersonaCode | null;
  now?: number;
}

export function selectSmartQuestion(args: SelectSmartQuestionArgs): SmartQuestionResult | null {
  const {
    pool, followups, answered, context,
    currentDirection, prevDirection, recentDirections,
    persona, now = Date.now(),
  } = args;

  const followUpAlreadyToday = countTodayFollowUpAnswers(followups, answered, now) >= 1;

  // 1
  const directionChange = selectDirectionChange(pool, prevDirection, currentDirection);
  if (directionChange) return { question: directionChange, source: 'direction_change' };

  // 2·3 — 일일 상한 체크
  if (!followUpAlreadyToday) {
    const answerChanged = selectAnswerChangedFollowUp(pool, followups, answered, context, persona, now);
    if (answerChanged) return { question: answerChanged, source: 'follow_up' };

    const scheduled = selectScheduledFollowUp(pool, followups, answered, context, persona, now);
    if (scheduled) return { question: scheduled, source: 'follow_up' };
  }

  // 4
  const directionSteady = selectDirectionSteady(pool, recentDirections, currentDirection);
  if (directionSteady) return { question: directionSteady, source: 'direction_steady' };

  // 5
  const general = selectByGeneralScore(pool, context, answered, persona, now);
  if (general) return { question: general, source: 'general' };

  return null;
}

// ============================================================
// React Hook — store 와 selectSmartQuestion 합성
// ============================================================
export function useSmartQuestion(
  context: QuestionContext,
  currentDirection: Direction,
): SmartQuestionResult | null {
  const { pool, answered, followups } = useQuestionStore();
  const { entries } = useJournalStore();
  const personaPrimary = usePersonaStore((s) => s.primary);

  return selectSmartQuestion({
    pool,
    followups,
    answered: answered as Record<string, AnsweredQuestion | undefined>,
    context,
    currentDirection,
    prevDirection: entries[1]?.direction ?? null,
    recentDirections: entries.slice(0, 3).map((e) => e.direction),
    persona: personaPrimary,
  });
}
