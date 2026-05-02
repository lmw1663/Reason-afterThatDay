import { supabase } from './supabase';

export async function addIntrusiveMemoryResponse(params: {
  userId: string;
  moodScore: number;
  thoughtText?: string;
  isEscalatedToJournal?: boolean;
}): Promise<void> {
  const { error } = await supabase.from('intrusive_memory_response').insert({
    user_id: params.userId,
    mood_score: params.moodScore,
    thought_text: params.thoughtText ?? null,
    is_escalated_to_journal: params.isEscalatedToJournal ?? false,
    triggered_at: new Date().toISOString(),
  });
  if (error) throw error;
}
