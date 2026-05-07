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

export interface KnotArchiveRow {
  id: string;
  cycleIndex: number;
  archivedAt: string;
  knotLabel: '매듭' | '마무리' | '단절 30일 달성';
  summary: Record<string, unknown>;
}

/**
 * 사용자의 모든 매듭 archive를 cycle_index 내림차순으로 조회.
 * [기록] 탭에 사이클 타임라인 노출용 (F-10).
 */
export async function fetchKnotArchives(userId: string): Promise<KnotArchiveRow[]> {
  const { data, error } = await supabase
    .from('knot_archive')
    .select('id, cycle_index, archived_at, knot_label, summary')
    .eq('user_id', userId)
    .order('cycle_index', { ascending: false });
  if (error) throw new Error(`fetchKnotArchives failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    cycleIndex: row.cycle_index as number,
    archivedAt: row.archived_at as string,
    knotLabel: row.knot_label as KnotArchiveRow['knotLabel'],
    summary: (row.summary as Record<string, unknown>) ?? {},
  }));
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
