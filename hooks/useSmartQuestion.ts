import { useQuestionStore, type Question, type QuestionContext } from '@/store/useQuestionStore';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getQuestionBooster,
  isQuestionBlocked,
} from '@/constants/personaQuestionWeights';
import type { PersonaCode } from '@/utils/personaClassifier';

const DIRECTION_CHANGE_QUESTION: Question = {
  id: 'j_direction_change',
  text: '뭐가 마음을 바꿨어?',
  context: ['journal'],
  isActive: true,
  weight: 10,
};

const DIRECTION_STEADY_QUESTION: Question = {
  id: 'j_direction_steady',
  text: '이 마음이 꽤 단단해 보여. 어디서 온 걸까?',
  context: ['journal'],
  isActive: true,
  weight: 8,
};

function isInCooldown(answered: { updatedAt: string } | undefined): boolean {
  if (!answered) return false;
  const elapsed = Date.now() - new Date(answered.updatedAt).getTime();
  return elapsed < 72 * 60 * 60 * 1000; // 72시간 쿨다운
}

function scoreQuestion(
  q: Question,
  answered: Record<string, { updatedAt: string; status: string }>,
  _direction: Direction,
  persona: PersonaCode | null,
): number {
  const a = answered[q.id];
  let score = q.weight;
  if (!a) score += 5; // 미답변 가산점
  if (a?.status === 're_ask') score += 3;
  // C-2-G-3b: 페르소나별 우선 노출 부스터
  score += getQuestionBooster(persona, q.id);
  return score;
}

export function useSmartQuestion(context: QuestionContext, currentDirection: Direction): Question | null {
  const { pool, answered } = useQuestionStore();
  const { entries } = useJournalStore();
  const personaPrimary = usePersonaStore(s => s.primary);

  const prevDirection = entries[1]?.direction ?? null;

  // 방향 바뀐 경우 → 변화 질문 우선
  if (prevDirection && prevDirection !== currentDirection) {
    return DIRECTION_CHANGE_QUESTION;
  }

  // 3일 연속 같은 방향 → 단단한 마음 질문
  const last3 = entries.slice(0, 3).map((e) => e.direction);
  if (last3.length === 3 && last3.every((d) => d === currentDirection)) {
    return DIRECTION_STEADY_QUESTION;
  }

  // 풀에서 맥락 맞는 질문 선택 + 페르소나별 차단·부스터 적용 (C-2-G-3b)
  const candidates = pool
    .filter((q) => q.context.includes(context) && q.isActive)
    .filter((q) => !isInCooldown(answered[q.id] as { updatedAt: string } | undefined))
    .filter((q) => !isQuestionBlocked(personaPrimary, q.id))
    .sort(
      (a, b) =>
        scoreQuestion(b, answered as Record<string, { updatedAt: string; status: string }>, currentDirection, personaPrimary) -
        scoreQuestion(a, answered as Record<string, { updatedAt: string; status: string }>, currentDirection, personaPrimary),
    );

  return candidates[0] ?? null;
}
