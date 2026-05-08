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

// Phase I — pickReasonReflection 으로 고른 질문의 *전체 timeline* 반환.
// AnswerTimeline 컴포넌트에 entries 그대로 넘기면 되도록.
//
// 안전장치 두 가지:
//   1. recordedAt 명시적 asc 정렬 — fetchResponseHistoryByCategory 의 ORDER BY 에
//      의존하지 않아 미래 쿼리 변경에도 회상 순서 안정
//   2. 인접 동일값 dedup — 서버 트리거가 동일값 archive 를 막지만 INSERT 직후
//      UPDATE 같은 race / 백필 케이스 방어. AnswerTimeline 의 "처음/지금"
//      라벨링 정합성 보장
export function pickActiveReasonTimeline(
  history: ReflectionEntry[],
): { questionId: string; entries: ReflectionEntry[] } | null {
  const picked = pickReasonReflection(history);
  if (!picked) return null;

  const sorted = history
    .filter((e) => e.questionId === picked.questionId)
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());

  const deduped: ReflectionEntry[] = [];
  let lastDisplay: string | null = null;
  for (const e of sorted) {
    const display = defaultPreviousAnswerFormatter(e.responseValue);
    if (display !== lastDisplay) {
      deduped.push(e);
      lastDisplay = display;
    }
  }
  return { questionId: picked.questionId, entries: deduped };
}
