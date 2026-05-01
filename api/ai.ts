// ⚠️ OpenAI 직접 호출 절대 금지 — Edge Function 프록시 경유만 허용
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

// ── fallback 응답 (Edge Function 실패 시) ───────────────────────────
function fallbackJournal(direction: Direction): string {
  if (direction === 'catch') return '잡고 싶은 마음이 느껴져. 그 마음 충분히 이해해.';
  if (direction === 'let_go') return '보내고 싶은 마음도 용기야. 잘 하고 있어.';
  return '지금 어떤 마음인지 정확히 몰라도 괜찮아. 그게 자연스러운 거야.';
}

const DAILY_QUOTE_FALLBACKS = [
  '오늘도 한 걸음씩. 네 속도가 맞는 속도야.',
  '감정은 정답이 없어. 지금 느끼는 게 진짜야.',
  '이 시간이 너를 단단하게 만들고 있어.',
  '흔들려도 괜찮아. 뿌리는 여기 있어.',
  '오늘 하루 수고했어.',
];

// ── invoke 래퍼 (5초 타임아웃 + AppError 코드 변환) ─────────────────
async function invokeWithTimeout<T>(
  fnName: string,
  body: unknown,
  timeoutMs = 5000,
): Promise<T> {
  const timer = new Promise<never>((_, reject) =>
    setTimeout(() => reject({ code: AppError.AI_TIMEOUT }), timeoutMs),
  );

  const invocation = supabase.functions.invoke(fnName, { body: body as Record<string, unknown> });

  const { data, error } = await Promise.race([invocation, timer]);
  if (error) throw { code: AppError.AI_FAILED, detail: error };
  return data as T;
}

// ── 일기 AI 응답 ────────────────────────────────────────────────────
export async function fetchJournalResponse(ctx: JournalContext): Promise<string> {
  try {
    const data = await invokeWithTimeout<{ response: string }>(
      'ai-journal-response',
      ctx,
    );
    return data.response;
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === AppError.AI_TIMEOUT || err.code === AppError.AI_FAILED) {
      return fallbackJournal(ctx.direction);
    }
    return fallbackJournal(ctx.direction);
  }
}

// ── 오늘의 한마디 (사전생성 캐시 포함) ─────────────────────────────
export async function fetchDailyQuote(
  daysElapsed: number,
  userId?: string,
): Promise<string> {
  try {
    const data = await invokeWithTimeout<{ response: string }>(
      'ai-daily-quote',
      { daysElapsed, userId },
      6000,
    );
    return data.response;
  } catch {
    return DAILY_QUOTE_FALLBACKS[Math.floor(Math.random() * DAILY_QUOTE_FALLBACKS.length)];
  }
}

// ── 상황별 위로 ──────────────────────────────────────────────────────
export async function fetchComfort(params: {
  situation: 'analysis' | 'compass' | 'graduation' | string;
  context?: string;
  daysElapsed: number;
}): Promise<string> {
  const FALLBACKS: Record<string, string> = {
    analysis: '지금 이 분석이 전부가 아니야. 마음은 훨씬 복잡하고 깊어.',
    compass: '나침반이 가리키는 건 힌트일 뿐이야. 결국 네가 결정하는 거야.',
    graduation: '졸업이 끝이 아니야. 새로운 시작이야.',
  };

  try {
    const data = await invokeWithTimeout<{ response: string }>('ai-comfort', params);
    return data.response;
  } catch {
    return FALLBACKS[params.situation] ?? '지금 이 순간도 잘 버티고 있어. 충분해.';
  }
}

// ── 졸업 편지 (gpt-4o, 10초 타임아웃) ──────────────────────────────
export async function fetchGraduationLetter(params: {
  daysElapsed: number;
  moodAvg?: number;
  reasons?: string[];
  pros?: string[];
  cons?: string[];
  journalCount?: number;
}): Promise<string> {
  try {
    const data = await invokeWithTimeout<{ response: string }>(
      'ai-graduation-letter',
      params,
      10000,
    );
    return data.response;
  } catch {
    return '지금 이 순간까지 버텨온 나에게.\n\n쉽지 않았어. 그 마음 알아. 그런데 있잖아, 지금 여기까지 온 것만으로도 충분해.\n\n앞으로 어떻게 될지 모르겠어. 근데 그게 나쁜 건 아닐 것 같아. 아직 쓰여지지 않은 페이지가 있다는 거니까.';
  }
}
