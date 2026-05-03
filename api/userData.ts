import { supabase } from './supabase';

// X-1 PIPA 컴플라이언스 — 사용자 데이터 조회·반출·삭제.
// 개인정보 보호법 제35조(열람) · 제36조(정정·삭제) · GDPR Art.20(반출권) 대응.
//
// 모든 함수는 RLS(user_id 일치)에 의존 — 호출자가 user_id를 자기 것으로만 넘겨야.
// supabase auth.users 자체 삭제는 admin RPC 필요 → 본 모듈은 *DB 행*만 처리.
// 호출자는 후속으로 supabase.auth.signOut() + 별도 admin 트랙으로 auth 계정 삭제 필요.
//
// AsyncStorage 로컬 데이터(memory_seal_v1·declutter·continuing-bonds·encounter-plan)는
// 디바이스 전용이라 본 함수 범위 외 — 호출자가 별도 AsyncStorage.clear() 호출 권장.

const USER_TABLES = [
  'journal_entries',
  'question_responses',
  'relationship_profile',
  'decision_history',
  'graduation_cooling',
  'graduation_farewell',
  'cooling_reflections',
  'intrusive_memory_response',
  'memory_organization',
  'memory_log',
  'self_reflections',
  'personas',
  'psych_profile_axes',
  'crisis_assessments',
  'safety_lockouts',
] as const;

export type UserTable = typeof USER_TABLES[number];

const TABLE_LABELS: Record<UserTable, string> = {
  journal_entries:           '이별 일기',
  question_responses:        '질문 응답',
  relationship_profile:      '관계 프로필',
  decision_history:          '방향 변화 이력',
  graduation_cooling:        '유예 기록',
  graduation_farewell:       '작별 글',
  cooling_reflections:       '유예 체크인',
  intrusive_memory_response: '떠올랐어 기록',
  memory_organization:       '추억 분류',
  memory_log:                '추억 메모',
  self_reflections:          'about-me 답변',
  personas:                  '페르소나 분류',
  psych_profile_axes:        '심리 프로파일 축',
  crisis_assessments:        '위기 평가',
  safety_lockouts:           '안전 잠금 이력',
};

export interface DataSummaryItem {
  tableName: UserTable;
  label: string;
  count: number;
}

/** 사용자 데이터 카운트 요약 — PIPA 열람권(제35조) 1차 응답. */
export async function getDataSummary(userId: string): Promise<DataSummaryItem[]> {
  const results: DataSummaryItem[] = [];
  for (const t of USER_TABLES) {
    const { count, error } = await supabase
      .from(t)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) continue; // 한 테이블 실패해도 나머지는 진행
    results.push({ tableName: t, label: TABLE_LABELS[t], count: count ?? 0 });
  }
  return results;
}

export interface ExportPayload {
  exportedAt: string;
  userId: string;
  schemaVersion: 1;
  data: Record<string, unknown[]>;
}

/**
 * 사용자 전체 데이터를 JSON으로 반출 — GDPR Art.20 반출권 대응.
 * users 프로필 1건 + USER_TABLES 전체 행. RLS 통과한 본인 데이터만.
 */
export async function exportUserData(userId: string): Promise<ExportPayload> {
  const data: Record<string, unknown[]> = {};

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (profile) data.users = [profile];

  for (const t of USER_TABLES) {
    const { data: rows } = await supabase.from(t).select('*').eq('user_id', userId);
    if (rows && rows.length > 0) data[t] = rows;
  }

  return {
    exportedAt: new Date().toISOString(),
    userId,
    schemaVersion: 1,
    data,
  };
}

export interface DeleteResult {
  deletedTables: UserTable[];
  failedTables: string[];
}

/**
 * 사용자 모든 *DB 행* 삭제 — PIPA 삭제권(제36조) 대응.
 *
 * users 행 자체는 ON DELETE CASCADE로 자식 행도 함께 사라지나,
 * 명시적으로 자식부터 삭제해 RLS 정책 검증 + 부분 실패 추적 가능.
 *
 * **주의**: supabase auth.users 자체 삭제는 admin 권한 필요 — 별도 트랙(Edge Function 또는
 * 외부 admin RPC)으로 처리. 본 함수 후 호출자는 supabase.auth.signOut() 권장.
 */
/**
 * 계정 자체 삭제 — Edge Function `account-delete` 호출. PIPA §36 완전 처리.
 * auth.admin.deleteUser → public.users ON DELETE CASCADE로 모든 자식 행 자동 삭제.
 *
 * 호출자는 본 함수 success 후 supabase.auth.signOut() + AsyncStorage.clear() + 홈 이동.
 * 실패 시 호출자가 deleteAllUserData(DB 행만)로 fallback 처리 권장.
 */
export async function deleteAccount(): Promise<void> {
  const { data, error } = await supabase.functions.invoke('account-delete', { body: {} });
  if (error) throw error;
  const result = data as { deleted?: boolean; error?: string; message?: string };
  if (!result.deleted) {
    throw new Error(result.message ?? result.error ?? 'account_delete_failed');
  }
}

export async function deleteAllUserData(userId: string): Promise<DeleteResult> {
  const deletedTables: UserTable[] = [];
  const failedTables: string[] = [];

  for (const t of USER_TABLES) {
    const { error } = await supabase.from(t).delete().eq('user_id', userId);
    if (error) failedTables.push(t);
    else deletedTables.push(t);
  }

  const { error: userErr } = await supabase.from('users').delete().eq('id', userId);
  if (userErr) failedTables.push('users');

  return { deletedTables, failedTables };
}
