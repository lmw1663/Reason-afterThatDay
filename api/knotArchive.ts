/**
 * knot_archive INSERT API — F-8
 *
 * 매듭 사이클 종료 시 스냅샷 보존. RLS는 INSERT·SELECT만 허용 — 한 번 저장된
 * archive는 수정·삭제 불가 (graduation_farewell과 동일 정책).
 *
 * 스펙: docs/psychology-logic/redesign-graduation.md §5-1 (033_relationship_cycle.sql)
 */

import { supabase } from './supabase';
import type { KnotArchiveSnapshot } from '@/utils/knotCycle';

export async function saveKnotArchive(args: {
  userId: string;
  coolingPeriodId: string;
  snapshot: KnotArchiveSnapshot;
}): Promise<void> {
  const { error } = await supabase.from('knot_archive').insert({
    user_id: args.userId,
    cooling_period_id: args.coolingPeriodId,
    cycle_index: args.snapshot.cycleIndex,
    knot_label: args.snapshot.knotLabel,
    summary: args.snapshot.summary,
  });
  if (error) {
    throw new Error(`saveKnotArchive failed: ${error.message}`);
  }
}

/**
 * relationship_profile.cycle_count 증가 + last_knot_at·last_knot_label 갱신.
 * 새 사이클 시작 시 호출.
 */
export async function advanceRelationshipCycle(args: {
  userId: string;
  newCycleCount: number;
  lastKnotAt: string;
  lastKnotLabel: string;
}): Promise<void> {
  const { error } = await supabase
    .from('relationship_profile')
    .update({
      cycle_count: args.newCycleCount,
      last_knot_at: args.lastKnotAt,
      last_knot_label: args.lastKnotLabel,
    })
    .eq('user_id', args.userId);
  if (error) {
    throw new Error(`advanceRelationshipCycle failed: ${error.message}`);
  }
}
