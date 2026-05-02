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
    physicalSignals: (row.physical_signals as string[]) ?? [],
    direction: row.direction as Direction,
    freeText: row.free_text as string | undefined,
    aiResponse: row.ai_response as string | undefined,
  };
}

export async function upsertJournalEntry(params: {
  userId: string;
  moodScore: number;
  moodLabel: string[];
  physicalSignals?: string[];
  direction: Direction;
  freeText?: string;
  aiResponse?: string;
}): Promise<JournalEntry> {
  // PostgREST의 on_conflict 파라미터는 표현식 기반 unique index를 지원하지 않으므로
  // 오늘 항목 존재 여부를 직접 확인 후 insert/update로 분기
  const existing = await fetchTodayEntry(params.userId);

  const payload = {
    mood_score: params.moodScore,
    mood_label: params.moodLabel,
    physical_signals: params.physicalSignals ?? [],
    direction: params.direction,
    free_text: params.freeText ?? null,
    ai_response: params.aiResponse ?? null,
  };

  if (existing) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw { code: AppError.AI_FAILED, detail: error };
    return toJournalEntry(data);
  }

  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: params.userId, created_at: new Date().toISOString(), ...payload })
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
  // KST(UTC+9) 기준 오늘 자정~23:59를 UTC로 변환
  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset).toISOString().slice(0, 10);
  const startUtc = new Date(`${kstDate}T00:00:00+09:00`).toISOString();
  const endUtc = new Date(`${kstDate}T23:59:59+09:00`).toISOString();

  const { data } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startUtc)
    .lte('created_at', endUtc)
    .maybeSingle();

  return data ? toJournalEntry(data) : null;
}
