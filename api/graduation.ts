import { supabase } from './supabase';
import type { CoolingStatus } from '@/store/useCoolingStore';

export interface CoolingRow {
  id: string;
  status: CoolingStatus;
  requestedAt: string;
  coolingEndsAt: string;
  checkinResponses: unknown[];
  notificationsSent: number;
}

function toRow(row: Record<string, unknown>): CoolingRow {
  return {
    id: row.id as string,
    status: row.status as CoolingStatus,
    requestedAt: row.requested_at as string,
    coolingEndsAt: row.cooling_ends_at as string,
    checkinResponses: (row.checkin_responses as unknown[]) ?? [],
    notificationsSent: (row.notifications_sent as number) ?? 0,
  };
}

export async function fetchGraduationStatus(userId: string): Promise<CoolingRow | null> {
  const { data } = await supabase
    .from('graduation_cooling')
    .select('*')
    .eq('user_id', userId)
    .order('requested_at', { ascending: false })
    .limit(1)
    .single();
  return data ? toRow(data) : null;
}

// 매듭 신청 → cooling 상태 생성 (즉시 확정 금지 — 페르소나별 N일 유예 필수)
//
// F-7: cooling_period_days·knot_label·persona_codes를 호출자(request.tsx)에서 주입.
// 미주입 시 DB DEFAULT(7일·매듭·{}) 적용 — 기존 호환.
// cooling_ends_at은 클라이언트 산정값을 함께 보냄 (DB CHECK 없음, 정합성은 호출자 책임).
export interface RequestGraduationOpts {
  coolingPeriodDays?: number;
  knotLabel?: string;
  personaCodes?: string[];
  coolingEndsAt?: string;
  cycleIndex?: number;
}

export async function requestGraduation(
  userId: string,
  opts: RequestGraduationOpts = {},
): Promise<CoolingRow> {
  const { data, error } = await supabase
    .from('graduation_cooling')
    .insert({
      user_id: userId,
      ...(opts.coolingPeriodDays !== undefined && { cooling_period_days: opts.coolingPeriodDays }),
      ...(opts.knotLabel !== undefined && { knot_label: opts.knotLabel }),
      ...(opts.personaCodes !== undefined && { persona_codes: opts.personaCodes }),
      ...(opts.coolingEndsAt !== undefined && { cooling_ends_at: opts.coolingEndsAt }),
      ...(opts.cycleIndex !== undefined && { cycle_index: opts.cycleIndex }),
    })
    .select()
    .single();
  if (error) throw error;
  return toRow(data);
}

export async function updateCoolingStatus(id: string, status: CoolingStatus): Promise<void> {
  await supabase.from('graduation_cooling').update({ status }).eq('id', id);
}

// 취소/리셋 시 checkin_responses 데이터 보존 — 졸업 리포트 반영
export async function cancelCooling(id: string): Promise<void> {
  await supabase
    .from('graduation_cooling')
    .update({ status: 'cancelled' })
    .eq('id', id);
}

// 페르소나별 N일 연장 — requested_at + cooling_ends_at 재설정, notifications_sent 리셋, 체크인 보존
// 호출자가 현재 페르소나 정책의 coolingDays를 주입 (미주입 시 7일 baseline)
export async function resetCooling(id: string, coolingDays: number = 7): Promise<void> {
  const now = new Date();
  const endsAt = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);
  await supabase
    .from('graduation_cooling')
    .update({
      requested_at: now.toISOString(),
      cooling_ends_at: endsAt.toISOString(),
      notifications_sent: 0,
    })
    .eq('id', id);
}

export async function addCheckinResponse(id: string, response: unknown): Promise<void> {
  const { data } = await supabase
    .from('graduation_cooling')
    .select('checkin_responses')
    .eq('id', id)
    .single();

  const existing = (data?.checkin_responses as unknown[]) ?? [];
  await supabase
    .from('graduation_cooling')
    .update({ checkin_responses: [...existing, response] })
    .eq('id', id);
}

export async function confirmGraduation(userId: string, coolingId: string): Promise<void> {
  await Promise.all([
    supabase
      .from('graduation_cooling')
      .update({ status: 'confirmed' })
      .eq('id', coolingId),
    supabase
      .from('users')
      .update({ graduation_confirmed_at: new Date().toISOString() })
      .eq('id', userId),
  ]);
}
