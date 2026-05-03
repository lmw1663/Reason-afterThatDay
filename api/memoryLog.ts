import { supabase } from './supabase';

export type MemoryCategory = 'photo' | 'message' | 'place' | 'other';

export interface MemoryLog {
  id: string;
  category: MemoryCategory | null;
  content: string;
  createdAt: string;
}

function toMemoryLog(row: Record<string, unknown>): MemoryLog {
  return {
    id: row.id as string,
    category: (row.category as MemoryCategory | null) ?? null,
    content: row.content as string,
    createdAt: row.created_at as string,
  };
}

export async function fetchMemoryLogs(userId: string): Promise<MemoryLog[]> {
  const { data, error } = await supabase
    .from('memory_log')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => toMemoryLog(row as Record<string, unknown>));
}

export async function addMemoryLog(
  userId: string,
  content: string,
  category: MemoryCategory | null,
): Promise<MemoryLog> {
  const { data, error } = await supabase
    .from('memory_log')
    .insert({ user_id: userId, content, category })
    .select('*')
    .single();
  if (error) throw error;
  return toMemoryLog(data as Record<string, unknown>);
}

export async function deleteMemoryLog(id: string): Promise<void> {
  const { error } = await supabase.from('memory_log').delete().eq('id', id);
  if (error) throw error;
}
