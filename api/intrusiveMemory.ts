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

/**
 * 최근 N일·이전 N일 떠올림 횟수 — C-2-G-7b (P09 카운터 위젯).
 *
 * 매트릭스 §2 C7 P09: "*그 사람 생각이 떠올랐어* 카운터 + 줄어드는 추세 시각화".
 * 헌신 소진형 사용자에게 *추세*(이번 7일 vs 지난 7일)를 보여줘 회복 진전 시각화.
 */
export async function getIntrusiveMemoryTrend(
  userId: string,
  days: number = 7,
): Promise<{ recent: number; previous: number }> {
  const now = new Date();
  const recentStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const [recentResult, previousResult] = await Promise.all([
    supabase
      .from('intrusive_memory_response')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('triggered_at', recentStart.toISOString()),
    supabase
      .from('intrusive_memory_response')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('triggered_at', previousStart.toISOString())
      .lt('triggered_at', recentStart.toISOString()),
  ]);

  return {
    recent: recentResult.count ?? 0,
    previous: previousResult.count ?? 0,
  };
}
