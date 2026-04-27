import { supabase } from './supabase';
import { AppError } from '@/constants/errors';
import type { Direction, JournalEntry } from '@/store/useJournalStore';

function toJournalEntry(row: Record<string, unknown>): JournalEntry {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    createdAt: row.created_at as string,
    moodScore: row.mood_score as number,
    moodLabel: (row.mood_label as string[]) ?? [],
    direction: row.direction as Direction,
    freeText: row.free_text as string | undefined,
    aiResponse: row.ai_response as string | undefined,
  };
}

export async function upsertJournalEntry(params: {
  userId: string;
  moodScore: number;
  moodLabel: string[];
  direction: Direction;
  freeText?: string;
  aiResponse?: string;
}): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert(
      {
        user_id: params.userId,
        mood_score: params.moodScore,
        mood_label: params.moodLabel,
        direction: params.direction,
        free_text: params.freeText,
        ai_response: params.aiResponse,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,date(created_at at time zone \'Asia/Seoul\')' },
    )
    .select()
    .single();

  if (error) throw { code: AppError.AI_FAILED, detail: error };
  return toJournalEntry(data);
}

export async function fetchRecentEntries(userId: string, limit = 7): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toJournalEntry);
}

export async function fetchTodayEntry(userId: string): Promise<JournalEntry | null> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
    .single();

  return data ? toJournalEntry(data) : null;
}
