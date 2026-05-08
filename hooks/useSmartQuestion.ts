// Phase C — useSmartQuestion 파이프라인 분해
//
// 변경 전: 단일 함수 안에서 방향 변화·연속·일반 점수 분기를 모두 수행.
// 변경 후: 순수 함수 단계로 분리 → 단위 테스트 + Phase D 후속 트리거 단계 추가의 토대.
//
// 우선순위 (위 → 아래, 첫 매칭만 반환):
//   1. selectDirectionChange     — 어제 ↔ 오늘 방향 다름
//   2. selectDirectionSteady     — 3일 연속 같은 방향
//   3. selectByGeneralScore      — 컨텍스트 매칭 + 페르소나 부스터/차단 + 쿨다운
//
// Phase D 에서 selectAnswerChangedFollowUp / selectScheduledRevisit 단계가
// 1과 2 사이에 끼워들어갈 예정.
//
// ─────────────────────────────────────────────────────────────────────
// Phase C 에서 *의도적으로 제외된* 안전 게이트 (Phase G 통합 예정):
//   · C-SSRS 양성 잠금 — `safety_lockouts.decision_locked / graduation_locked`
//     체크는 hook 진입부 *위*(question 단계가 아니라 hook 자체)에서 가드
//   · 매듭 권유 비허용 페르소나(P03/P11/P16/P19) — graduation context 질문이
//     `selectScheduledRevisit` 로 끌려나올 때 카테고리·context 차원 차단 필요
//   · 후속 질문 일일 상한 — 후속 트리거(Phase D)가 하루 1개 이상 발화하지
//     않도록 hook 진입부에서 카운트
// 현재 단계는 *기존 isQuestionBlocked 차단*만 유지. 새 안전 분기는 Phase G에서.
// ─────────────────────────────────────────────────────────────────────

import {
  useQuestionStore,
  type Question,
  type QuestionContext,
  type AnsweredQuestion,
} from '@/store/useQuestionStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getQuestionBooster,
  isQuestionBlocked,
} from '@/constants/personaQuestionWeights';
import type { PersonaCode } from '@/utils/personaClassifier';

// 풀 미로드(앱 첫 실행·네트워크 실패) 시 안전 폴백.
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

export type SmartQuestionSource = 'direction_change' | 'direction_steady' | 'general';

export interface SmartQuestionResult {
  question: Question;
  source: SmartQuestionSource;
}

function pickFromPool(pool: Question[], id: string, fallback: Question): Question {
  return pool.find((q) => q.id === id) ?? fallback;
}

// ============================================================
// Pure pipeline 단계들 — 외부 의존성 없이 인자만으로 결정. 단위 테스트 직접 가능.
// ============================================================

export function isInCooldown(
  answered: Pick<AnsweredQuestion, 'updatedAt'> | undefined,
  now: number = Date.now(),
): boolean {
  if (!answered) return false;
  const elapsed = now - new Date(answered.updatedAt).getTime();
  return elapsed < COOLDOWN_MS;
}

// 1) 방향 변화 우선
export function selectDirectionChange(
  pool: Question[],
  prevDirection: Direction | null,
  currentDirection: Direction,
): Question | null {
  if (!prevDirection || prevDirection === currentDirection) return null;
  return pickFromPool(pool, 'j_direction_change', DIRECTION_CHANGE_FALLBACK);
}

// 2) 3일 연속 동일 방향
export function selectDirectionSteady(
  pool: Question[],
  recentDirections: Direction[],
  currentDirection: Direction,
): Question | null {
  if (recentDirections.length < 3) return null;
  if (!recentDirections.slice(0, 3).every((d) => d === currentDirection)) return null;
  return pickFromPool(pool, 'j_direction_steady', DIRECTION_STEADY_FALLBACK);
}

// 점수 산정 — weight + 미답변(+5) + re_ask(+3) + 페르소나 부스터.
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

// 3) 일반 점수 기반 — context·isActive·cooldown·persona 차단을 모두 통과한 후보 정렬
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
// React Hook — 위 pure 단계들을 store 와 합성
// ============================================================
export function useSmartQuestion(
  context: QuestionContext,
  currentDirection: Direction,
): SmartQuestionResult | null {
  const { pool, answered } = useQuestionStore();
  const { entries } = useJournalStore();
  const personaPrimary = usePersonaStore((s) => s.primary);

  const prevDirection = entries[1]?.direction ?? null;
  const recentDirections = entries.slice(0, 3).map((e) => e.direction);

  const directionChange = selectDirectionChange(pool, prevDirection, currentDirection);
  if (directionChange) return { question: directionChange, source: 'direction_change' };

  const directionSteady = selectDirectionSteady(pool, recentDirections, currentDirection);
  if (directionSteady) return { question: directionSteady, source: 'direction_steady' };

  const general = selectByGeneralScore(
    pool,
    context,
    answered as Record<string, AnsweredQuestion | undefined>,
    personaPrimary,
  );
  if (general) return { question: general, source: 'general' };

  return null;
}
