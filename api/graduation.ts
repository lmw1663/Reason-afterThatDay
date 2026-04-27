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

// 졸업 신청 → cooling 상태 생성 (즉시 확정 금지 — 7일 유예 필수)
export async function requestGraduation(userId: string): Promise<CoolingRow> {
  const { data, error } = await supabase
    .from('graduation_cooling')
    .insert({ user_id: userId })
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

// 7일 연장 — requested_at 재설정, notifications_sent 리셋, 체크인 보존
export async function resetCooling(id: string): Promise<void> {
  await supabase
    .from('graduation_cooling')
    .update({ requested_at: new Date().toISOString(), notifications_sent: 0 })
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
