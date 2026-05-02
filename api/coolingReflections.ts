import { supabase } from './supabase';

export async function saveCoolingReflection(params: {
  userId: string;
  coolingPeriodId: string;
  day: 5 | 6;
  reflectionType: 'learning' | 'future_plan';
  text: string;
}): Promise<void> {
  const { error } = await supabase.from('cooling_reflections').insert({
    user_id: params.userId,
    cooling_period_id: params.coolingPeriodId,
    day: params.day,
    reflection_type: params.reflectionType,
    reflection_text: params.text,
  });
  if (error) throw error;
}

export async function fetchEarliestJournalEntry(userId: string): Promise<{
  moodScore: number;
  freeText: string | null;
  createdAt: string;
} | null> {
  const { data } = await supabase
    .from('journal_entries')
    .select('mood_score, free_text, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    moodScore: data.mood_score as number,
    freeText: data.free_text as string | null,
    createdAt: data.created_at as string,
  };
}

export async function fetchLastEntryBefore(
  userId: string,
  before: string,
): Promise<{ moodScore: number; freeText: string | null; createdAt: string } | null> {
  const { data } = await supabase
    .from('journal_entries')
    .select('mood_score, free_text, created_at')
    .eq('user_id', userId)
    .lt('created_at', before)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    moodScore: data.mood_score as number,
    freeText: data.free_text as string | null,
    createdAt: data.created_at as string,
  };
}
