// 통합 큐 답변 → freeText 컴포저 — 순수 헬퍼 (api 의존 없음).
//
// 단위 테스트 가능 + Edge Function·서버 측에서도 그대로 import 가능.
// 도메인 라우팅(`routeQueueAnswers`)은 supabase 클라이언트가 필요해 별도 모듈
// (`utils/journalQueueSink.ts`)로 분리.

import type { QueueAnswerPayload } from './journalQueueRouter';

/** AI/history용 라벨 — UI 노출 가능. */
export function formatAnswerLabel(a: QueueAnswerPayload): string {
  switch (a.kind) {
    case 'smartQ':
      return '오늘의 질문';
    case 'aboutMe':
      return '나에 대해';
    case 'memory':
      return '추억';
    case 'prosCons':
      return a.prosCons === 'cons' ? '오늘 떠오른 단점' : '오늘 떠오른 장점';
  }
}

/**
 * 사용자의 base freeText에 큐 답변들을 라벨 prefix로 붙여 합친다.
 * AI 컨텍스트·journal_entries.free_text 양쪽에 동일 텍스트 저장 → 단일 출처.
 */
export function composeAugmentedFreeText(
  baseFreeText: string | undefined,
  answers: readonly QueueAnswerPayload[],
): string {
  const blocks: string[] = [];
  const trimmedBase = baseFreeText?.trim();
  if (trimmedBase) blocks.push(trimmedBase);

  for (const a of answers) {
    const trimmed = a.text.trim();
    if (!trimmed) continue;
    blocks.push(`[${formatAnswerLabel(a)}] ${trimmed}`);
  }
  return blocks.join('\n\n');
}
