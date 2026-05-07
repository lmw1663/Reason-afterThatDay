/**
 * 매듭 사이클 가역성 — F-8
 *
 * 매듭 완료 후 사용자가 *새 사이클*을 시작할 때 호출되는 순수 로직.
 *   - 이전 사이클의 스냅샷을 knot_archive에 저장 (DB INSERT는 api/knotArchive.ts 책임)
 *   - relationship_profile.cycle_count 증가, last_knot_at 갱신
 *
 * 가역성(H1): 사용자는 매듭 후 *언제든* 다시 일기를 쓸 수 있고, 새 사이클이 시작되며
 * 이전 사이클의 일기·통계는 archive로 보존된다. 데이터 잠금·삭제 없음.
 */

import type { KnotLabel } from './knotPolicy';
import type { JournalEntry } from '@/store/useJournalStore';

export interface KnotArchiveSnapshot {
  cycleIndex: number;
  knotLabel: KnotLabel;
  /** 이전 사이클 통계 — 일기 수·평균 mood·페르소나 등 */
  summary: Record<string, unknown>;
}

/**
 * 매듭 완료 직후의 사이클 스냅샷 페이로드 빌드.
 * knot_archive 테이블 INSERT용.
 */
export function buildArchiveSnapshot(args: {
  cycleIndex: number;
  knotLabel: KnotLabel;
  entries: JournalEntry[];
  personaCodes: string[];
  coolingDays: number;
  lastKnotAt: string;
}): KnotArchiveSnapshot {
  const moodScores = args.entries.map((e) => e.moodScore);
  const moodAvg = moodScores.length
    ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
    : null;

  return {
    cycleIndex: args.cycleIndex,
    knotLabel: args.knotLabel,
    summary: {
      journal_count: args.entries.length,
      mood_avg: moodAvg,
      persona_codes: args.personaCodes,
      cooling_days: args.coolingDays,
      last_knot_at: args.lastKnotAt,
      // direction 분포 — 가장 빈도 높은 방향
      direction_counts: args.entries.reduce<Record<string, number>>((acc, e) => {
        acc[e.direction] = (acc[e.direction] ?? 0) + 1;
        return acc;
      }, {}),
    },
  };
}
