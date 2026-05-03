// @ts-nocheck — Deno runtime
// X-1-잔여 §37 처리정지권 — Edge Function 게이트 헬퍼.
// users 테이블의 notifications_suspended·ai_analysis_suspended 토글 검사.
//
// 본인 처리 정지 의사를 반영해 AI 호출/푸시 발송을 short-circuit.
// 위기 응답(C-SSRS·B-1 24h followup)은 안전 보호 우선이라 본 헬퍼와 무관 — 호출처에서 별도 정책.

export type SuspensionKind = 'notifications' | 'ai_analysis';

const COLUMN_MAP: Record<SuspensionKind, string> = {
  notifications: 'notifications_suspended',
  ai_analysis: 'ai_analysis_suspended',
};

/**
 * 단일 사용자의 처리 정지 상태 조회. fail-open(false) — 조회 실패 시 정지 안 됨으로 간주.
 * 사용자가 명시적으로 ON한 경우만 차단되도록.
 */
export async function isProcessingSuspended(
  supabase: { from: (t: string) => unknown },
  userId: string,
  kind: SuspensionKind,
): Promise<boolean> {
  const col = COLUMN_MAP[kind];
  // @ts-expect-error — supabase client chain 동적
  const { data } = await supabase.from('users').select(col).eq('id', userId).maybeSingle();
  return data?.[col] === true;
}

/**
 * 다수 사용자에 대한 처리 정지 상태 일괄 조회 — push cron 등에서 효율적 필터링.
 * 반환: 정지된 user_id Set.
 */
export async function fetchSuspendedUserIds(
  supabase: { from: (t: string) => unknown },
  userIds: string[],
  kind: SuspensionKind,
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  const col = COLUMN_MAP[kind];
  // @ts-expect-error — supabase client chain 동적
  const { data } = await supabase
    .from('users')
    .select(`id, ${col}`)
    .in('id', userIds)
    .eq(col, true);
  return new Set((data ?? []).map((r: { id: string }) => r.id));
}
