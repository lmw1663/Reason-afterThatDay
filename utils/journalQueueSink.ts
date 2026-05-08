// 일기 통합 큐 답변 → 도메인 테이블 라우팅 — Q-5
//
// 사용자가 큐에서 답한 모든 항목은 다음 두 경로로 보존된다:
//   1. journal_entries.free_text — `composeAugmentedFreeText`로 합쳐 1건 저장 (AI 컨텍스트·history)
//      → 순수 헬퍼는 utils/journalQueueCompose.ts에 분리 (api 의존 없음)
//   2. 도메인 테이블 — `routeQueueAnswers`로 종류별 라우팅 (반복 분석·시계열 추세)
//
// 정책 SSOT: docs/journal-unified-queue.md

import {
  fetchRelationshipProfile,
  upsertRelationshipProfile,
} from '@/api/relationship';
import { updateReflection } from '@/api/selfReflections';
import { todayKstString } from './journalQueueSkip';
import type { QueueAnswerPayload } from './journalQueueRouter';

// re-export — 호출처 호환 (단일 import 경로 보존)
export { composeAugmentedFreeText, formatAnswerLabel } from './journalQueueCompose';

/**
 * 도메인 테이블 라우팅 — fire-and-forget. 실패는 silent (일기 저장 흐름 보호).
 *
 *  · aboutMe → updateReflection (current 토글)
 *  · prosCons → relationship_profile에 누적 + prosByDate/consByDate 일별 인덱스
 *  · smartQ → question_responses (이미 question.tsx에서 markAnswered)
 *  · memory → freeText로만 (도메인 테이블 없음)
 */
export async function routeQueueAnswers(
  userId: string,
  answers: readonly QueueAnswerPayload[],
  now: number = Date.now(),
): Promise<void> {
  const today = todayKstString(now);
  const newPros: string[] = [];
  const newCons: string[] = [];

  for (const a of answers) {
    const trimmed = a.text.trim();
    if (!trimmed) continue;

    if (a.kind === 'aboutMe' && a.aboutMeCategory) {
      try {
        await updateReflection(userId, a.aboutMeCategory, { textResponse: trimmed });
      } catch (e) {
        console.warn('[queueSink] reflection save failed:', e);
      }
    } else if (a.kind === 'prosCons') {
      if (a.prosCons === 'pros') newPros.push(trimmed);
      if (a.prosCons === 'cons') newCons.push(trimmed);
    }
  }

  if (newPros.length === 0 && newCons.length === 0) return;

  try {
    const profile = await fetchRelationshipProfile(userId);
    const existingPros = profile?.pros ?? [];
    const existingCons = profile?.cons ?? [];
    const existingProsByDate = profile?.prosByDate ?? {};
    const existingConsByDate = profile?.consByDate ?? {};

    const nextProsByDate = newPros.length > 0
      ? {
          ...existingProsByDate,
          [today]: [...(existingProsByDate[today] ?? []), ...newPros],
        }
      : existingProsByDate;
    const nextConsByDate = newCons.length > 0
      ? {
          ...existingConsByDate,
          [today]: [...(existingConsByDate[today] ?? []), ...newCons],
        }
      : existingConsByDate;

    await upsertRelationshipProfile(userId, {
      pros: [...existingPros, ...newPros],
      cons: [...existingCons, ...newCons],
      prosByDate: nextProsByDate,
      consByDate: nextConsByDate,
    });
  } catch (e) {
    console.warn('[queueSink] relationship_profile save failed:', e);
  }
}
