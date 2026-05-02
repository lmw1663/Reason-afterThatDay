import { supabase } from './supabase';

export type MemoryCategory = 'photos' | 'messages' | 'places';

export interface MemoryOrgEntry {
  id: string;
  category: MemoryCategory;
  isCompleted: boolean;
  notes: string | null;
  completedAt: string | null;
  createdAt: string;
}

function toEntry(row: Record<string, unknown>): MemoryOrgEntry {
  return {
    id: row.id as string,
    category: row.category as MemoryCategory,
    isCompleted: row.is_completed as boolean,
    notes: (row.notes as string | null) ?? null,
    completedAt: (row.completed_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

/**
 * 3개 카테고리(사진/메시지/장소)의 정리 현황을 조회.
 * row가 없는 카테고리는 결과에서 빠짐 — 화면에서는 "미완료"로 취급.
 */
export async function fetchMemoryOrg(
  userId: string,
): Promise<Partial<Record<MemoryCategory, MemoryOrgEntry>>> {
  const { data, error } = await supabase
    .from('memory_organization')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  const result: Partial<Record<MemoryCategory, MemoryOrgEntry>> = {};
  for (const row of data ?? []) {
    const entry = toEntry(row as Record<string, unknown>);
    result[entry.category] = entry;
  }
  return result;
}

/**
 * 카테고리별 정리 상태를 upsert.
 * - 동일 (user_id, category) row가 있으면 update, 없으면 insert.
 * - isCompleted=true 일 때만 completed_at에 now() 기록.
 *   (재완료/취소를 다시 누를 가능성을 위해, 완료 시점을 매번 갱신)
 * - isCompleted=false 면 completed_at은 null로 되돌림.
 */
export async function upsertMemoryOrg(
  userId: string,
  category: MemoryCategory,
  payload: { isCompleted: boolean; notes?: string | null },
): Promise<MemoryOrgEntry> {
  const completedAt = payload.isCompleted ? new Date().toISOString() : null;

  const { data, error } = await supabase
    .from('memory_organization')
    .upsert(
      {
        user_id: userId,
        category,
        is_completed: payload.isCompleted,
        notes: payload.notes ?? null,
        completed_at: completedAt,
      },
      { onConflict: 'user_id,category' },
    )
    .select('*')
    .single();

  if (error) throw error;
  return toEntry(data as Record<string, unknown>);
}
