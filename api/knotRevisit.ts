/**
 * knot_revisit_schedule INSERT/SELECT/UPDATE — F-9
 *
 * 매듭 완료 후 회상 의식 푸시 스케줄. RLS는 user_id 기준 + DELETE 미허용 (발화 이력 보존).
 *
 * 마이그레이션: 034_revisit_rituals.sql
 */

import { supabase } from './supabase';
import type { RitualType } from '@/utils/knotRevisit';

export interface RevisitScheduleRow {
  id: string;
  userId: string;
  coolingPeriodId: string;
  scheduledAt: string;
  ritualType: RitualType;
  triggeredAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

function toRow(row: Record<string, unknown>): RevisitScheduleRow {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    coolingPeriodId: row.cooling_period_id as string,
    scheduledAt: row.scheduled_at as string,
    ritualType: row.ritual_type as RitualType,
    triggeredAt: (row.triggered_at as string) ?? null,
    completedAt: (row.completed_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export interface ScheduleEntry {
  ritualType: RitualType;
  scheduledAt: string;
}

/**
 * 여러 회상 의식을 한 번에 INSERT.
 * 매듭 신청 직후 1회 호출. 같은 cooling_period에 대해 중복 INSERT 방지는 호출자 책임.
 */
export async function scheduleRevisits(args: {
  userId: string;
  coolingPeriodId: string;
  schedules: ScheduleEntry[];
}): Promise<void> {
  if (args.schedules.length === 0) return;
  const rows = args.schedules.map((s) => ({
    user_id: args.userId,
    cooling_period_id: args.coolingPeriodId,
    scheduled_at: s.scheduledAt,
    ritual_type: s.ritualType,
  }));
  const { error } = await supabase.from('knot_revisit_schedule').insert(rows);
  if (error) throw new Error(`scheduleRevisits failed: ${error.message}`);
}

/**
 * 사용자가 due한 (현재 시각 ≤ scheduled_at, triggered_at NULL) 회상 의식 조회.
 * 클라이언트가 홈 진입 시 호출 → 서버 push 의존 없이 in-app 알림 발화 가능.
 */
export async function fetchDueRevisits(
  userId: string,
  now: Date = new Date(),
): Promise<RevisitScheduleRow[]> {
  const { data, error } = await supabase
    .from('knot_revisit_schedule')
    .select('*')
    .eq('user_id', userId)
    .is('triggered_at', null)
    .lte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(`fetchDueRevisits failed: ${error.message}`);
  return (data ?? []).map(toRow);
}

/**
 * 회상 의식 *발화* 표시. 푸시·in-app 알림이 사용자에게 전달된 시점에 호출.
 */
export async function markRevisitTriggered(id: string): Promise<void> {
  const { error } = await supabase
    .from('knot_revisit_schedule')
    .update({ triggered_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`markRevisitTriggered failed: ${error.message}`);
}

/**
 * 사용자가 회상 의식 화면을 *완료*한 시점 표시.
 */
export async function markRevisitCompleted(id: string): Promise<void> {
  const { error } = await supabase
    .from('knot_revisit_schedule')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`markRevisitCompleted failed: ${error.message}`);
}
