import { supabase } from './supabase';

export type ReflectionCategory =
  | 'love_self'
  | 'ideal_match'
  | 'self_love'
  | 'strengths'
  | 'self_care_in_relationship'
  | 'self_care_alone';

export type ReflectionSource = 'manual' | 'cooling_day5' | 'cooling_day6';

export interface SelfReflection {
  id: string;
  category: ReflectionCategory;
  score: number | null;
  labels: string[];
  textResponse: string | null;
  source: ReflectionSource;
  isCurrent: boolean;
  createdAt: string;
}

function toReflection(row: Record<string, unknown>): SelfReflection {
  return {
    id: row.id as string,
    category: row.category as ReflectionCategory,
    score: row.score as number | null,
    labels: (row.labels as string[]) ?? [],
    textResponse: row.text_response as string | null,
    source: row.source as ReflectionSource,
    isCurrent: row.is_current as boolean,
    createdAt: row.created_at as string,
  };
}

export async function fetchCurrentReflections(
  userId: string,
): Promise<Partial<Record<ReflectionCategory, SelfReflection>>> {
  const { data } = await supabase
    .from('self_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_current', true);

  const result: Partial<Record<ReflectionCategory, SelfReflection>> = {};
  for (const row of data ?? []) {
    const r = toReflection(row as Record<string, unknown>);
    result[r.category] = r;
  }
  return result;
}

export async function fetchCurrentReflectionByCategory(
  userId: string,
  category: ReflectionCategory,
  source: ReflectionSource = 'manual',
): Promise<SelfReflection | null> {
  const { data } = await supabase
    .from('self_reflections')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .eq('source', source)
    .eq('is_current', true)
    .maybeSingle();

  return data ? toReflection(data as Record<string, unknown>) : null;
}

export async function updateReflection(
  userId: string,
  category: ReflectionCategory,
  payload: { score?: number | null; labels?: string[]; textResponse?: string },
  source: ReflectionSource = 'manual',
): Promise<void> {
  // is_current 기존 row를 false로
  const { error: deactivateError } = await supabase
    .from('self_reflections')
    .update({ is_current: false })
    .eq('user_id', userId)
    .eq('category', category)
    .eq('source', source)
    .eq('is_current', true);
  if (deactivateError) throw deactivateError;

  // 새 row 삽입
  const { error: insertError } = await supabase.from('self_reflections').insert({
    user_id: userId,
    category,
    score: payload.score ?? null,
    labels: payload.labels ?? [],
    text_response: payload.textResponse ?? null,
    source,
    is_current: true,
  });
  if (insertError) throw insertError;
}
