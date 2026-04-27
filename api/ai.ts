import { supabase } from './supabase';
import { AppError } from '@/constants/errors';
import type { Direction } from '@/store/useJournalStore';

export interface JournalContext {
  moodScore: number;
  direction: Direction;
  freeText?: string;
  recentMoods: number[];
  daysElapsed: number;
}

function fallbackResponse(direction: Direction, score: number): string {
  if (direction === 'catch') return '잡고 싶은 마음이 느껴져. 그 마음 충분히 이해해.';
  if (direction === 'let_go') return '보내고 싶은 마음도 용기야. 잘 하고 있어.';
  return '지금 어떤 마음인지 정확히 몰라도 괜찮아. 그게 자연스러운 거야.';
}

export async function fetchJournalResponse(ctx: JournalContext): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const { data, error } = await supabase.functions.invoke('ai-journal-response', {
      body: ctx,
    });
    if (error) throw { code: AppError.AI_FAILED, detail: error };
    return data.response as string;
  } catch (e: unknown) {
    const err = e as { name?: string; code?: string };
    if (err.name === 'AbortError') throw { code: AppError.AI_TIMEOUT };
    // GPT 실패 시 fallback
    return fallbackResponse(ctx.direction, ctx.moodScore);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchDailyQuote(daysElapsed: number): Promise<string> {
  try {
    const { data, error } = await supabase.functions.invoke('ai-daily-quote', {
      body: { daysElapsed },
    });
    if (error) throw error;
    return data.response as string;
  } catch {
    return '오늘도 한 걸음씩. 네 속도가 맞는 속도야.';
  }
}
