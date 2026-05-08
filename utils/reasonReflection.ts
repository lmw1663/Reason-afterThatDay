// Phase H — letter 의 카테고리 회상 선택 로직.
// fetchResponseHistoryByCategory 결과(여러 questionId 의 entries 가 시간순 섞여 있음)
// 에서 "first ↔ latest 가 의미상 다른" 질문 중 latest.recordedAt 가 가장 최근인 것을 픽.

import { defaultPreviousAnswerFormatter } from '@/components/ui/answerFormatters';

export interface ReflectionEntry {
  questionId: string;
  responseValue: unknown;
  recordedAt: string;
  dPlus: number | null;
}

export interface ReasonReflectionPick {
  questionId: string;
  first: ReflectionEntry;
  latest: ReflectionEntry;
}

export function pickReasonReflection(
  history: ReflectionEntry[],
): ReasonReflectionPick | null {
  const grouped = new Map<string, ReflectionEntry[]>();
  for (const e of history) {
    const list = grouped.get(e.questionId);
    if (list) list.push(e);
    else grouped.set(e.questionId, [e]);
  }

  type Best = { questionId: string; first: ReflectionEntry; latest: ReflectionEntry; latestTs: number };
  let best: Best | null = null;

  for (const [qid, entries] of grouped) {
    if (entries.length < 2) continue;
    const first = entries[0];
    const latest = entries[entries.length - 1];
    const f = defaultPreviousAnswerFormatter(first.responseValue);
    const l = defaultPreviousAnswerFormatter(latest.responseValue);
    if (!f || !l || f === l) continue;
    const latestTs = new Date(latest.recordedAt).getTime();
    if (!best || latestTs > best.latestTs) {
      best = { questionId: qid, first, latest, latestTs };
    }
  }
  return best ? { questionId: best.questionId, first: best.first, latest: best.latest } : null;
}
