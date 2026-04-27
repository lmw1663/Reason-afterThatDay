import { supabase } from './supabase';
import type { RelationshipProfile } from '@/store/useRelationshipStore';

function toProfile(row: Record<string, unknown>): RelationshipProfile {
  return {
    reasons: (row.reasons as string[]) ?? [],
    pros:    (row.pros as string[])    ?? [],
    cons:    (row.cons as string[])    ?? [],
    fix:     (row.fix as number)       ?? 0,
    other:   (row.other as number)     ?? 0,
    role:    (row.role as number)      ?? 0,
  };
}

export async function fetchRelationshipProfile(userId: string): Promise<RelationshipProfile | null> {
  const { data } = await supabase
    .from('relationship_profile')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data ? toProfile(data) : null;
}

export async function upsertRelationshipProfile(
  userId: string,
  profile: Partial<RelationshipProfile>,
): Promise<void> {
  await supabase.from('relationship_profile').upsert(
    { user_id: userId, ...profile },
    { onConflict: 'user_id' },
  );
}
