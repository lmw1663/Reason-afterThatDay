import { supabase } from './supabase';
import type { CoolingStatus } from '@/store/useCoolingStore';

export interface CoolingRow {
  id: string;
  status: CoolingStatus;
  requestedAt: string;
  coolingEndsAt: string;
  checkinResponses: unknown[];
  notificationsSent: number;
  // F-12 P1-D: 매듭 신청 시점 페르소나 정책 스냅샷 (마이그레이션 032)
  knotLabel: string | null;
  coolingPeriodDays: number | null;
  personaCodes: string[];
  cycleIndex: number | null;
}

function toRow(row: Record<string, unknown>): CoolingRow {
  return {
    id: row.id as string,
    status: row.status as CoolingStatus,
    requestedAt: row.requested_at as string,
    coolingEndsAt: row.cooling_ends_at as string,
    checkinResponses: (row.checkin_responses as unknown[]) ?? [],
    notificationsSent: (row.notifications_sent as number) ?? 0,
    knotLabel: (row.knot_label as string) ?? null,
    coolingPeriodDays: (row.cooling_period_days as number) ?? null,
    personaCodes: (row.persona_codes as string[]) ?? [],
    cycleIndex: (row.cycle_index as number) ?? null,
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

/**
 * 매듭 확정 — F-8 가역성 처리 통합:
 *   1. graduation_cooling.status = 'confirmed'
 *   2. users.graduation_confirmed_at 기록
 *   3. archiveSummary 주입 시:
 *      - knot_archive INSERT (이전 cycle 스냅샷 보존)
 *      - relationship_profile.cycle_count++ + last_knot_at + last_knot_label
 *
 * archiveSummary 미주입 시 (1)·(2)만 처리 — 호환성 유지.
 */
export interface ConfirmGraduationOpts {
  knotLabel?: string;
  cycleIndex?: number;
  summary?: Record<string, unknown>;
}

export async function confirmGraduation(
  userId: string,
  coolingId: string,
  opts: ConfirmGraduationOpts = {},
): Promise<void> {
  const now = new Date().toISOString();
  await Promise.all([
    supabase
      .from('graduation_cooling')
      .update({ status: 'confirmed' })
      .eq('id', coolingId),
    supabase
      .from('users')
      .update({ graduation_confirmed_at: now })
      .eq('id', userId),
  ]);

  if (opts.knotLabel && opts.cycleIndex !== undefined) {
    // archive INSERT (UPDATE/DELETE 정책 없음 — 보존된 스냅샷)
    await supabase.from('knot_archive').insert({
      user_id: userId,
      cooling_period_id: coolingId,
      cycle_index: opts.cycleIndex,
      knot_label: opts.knotLabel,
      summary: opts.summary ?? {},
    });

    // relationship_profile 사이클 진행 — 다음 일기는 cycle_count+1로 자동 진입
    await supabase
      .from('relationship_profile')
      .update({
        cycle_count: opts.cycleIndex + 1,
        last_knot_at: now,
        last_knot_label: opts.knotLabel,
      })
      .eq('user_id', userId);
  }
}
