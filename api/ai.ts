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
// 같은 방향으로 매일 와도 응답이 단조롭지 않도록, 방향별 풀에서 랜덤 선택.
const FALLBACK_JOURNAL: Record<Direction, string[]> = {
  catch: [
    '잡고 싶은 마음이 느껴져. 그 마음 충분히 이해해.',
    '함께였던 시간이 떠오르는 날이구나. 그리움도 사랑의 한 모양이야.',
    '다시 닿고 싶은 마음, 억누르지 않아도 돼. 그게 너의 솔직한 지금이야.',
    '잡고 싶은 마음이 진심인지, 외로움인지 — 천천히 구분해봐도 괜찮아.',
    '오늘은 그 사람의 좋은 면이 더 크게 떠오르는 것 같네. 그것도 자연스러운 흐름이야.',
  ],
  let_go: [
    '보내고 싶은 마음도 용기야. 잘 하고 있어.',
    '한 걸음 앞으로 가려는 너, 그 결심을 응원해.',
    '놓는다는 건 잊는다는 게 아니야. 너만의 길을 가는 거야.',
    '오늘 너의 마음이 단단해 보여. 그 단단함도 회복의 한 모양이야.',
    '보내려 하는 마음에 죄책감 두지 마. 그건 너를 지키는 결정이기도 해.',
  ],
  undecided: [
    '지금 어떤 마음인지 정확히 몰라도 괜찮아. 그게 자연스러운 거야.',
    '흐릿한 날에는 흐릿한 채로 있어도 돼. 결정은 다음에 해도 돼.',
    '두 마음이 같이 있는 거, 모순이 아니라 솔직함이야.',
    '아직 정리되지 않은 마음을 그대로 두는 것도 회복이야.',
    '오늘은 어느 쪽으로도 기울지 않는 날인 것 같아. 그것도 충분해.',
  ],
};

function fallbackJournal(direction: Direction): string {
  const pool = FALLBACK_JOURNAL[direction] ?? FALLBACK_JOURNAL.undecided;
  return pool[Math.floor(Math.random() * pool.length)];
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

// ── 체크인 GPT 응답 ─────────────────────────────────────────────────
const CHECKIN_FALLBACK: Record<number, string> = {
  1: '첫 하루를 견뎌낸 것만으로 충분해. 천천히 호흡해보자.',
  2: '지금 흔들리는 것도 정상이야. 너는 충분히 고민했던 사람이야.',
  3: '미움이나 분노가 떠올라도 괜찮아. 그것도 너의 정직한 마음이야.',
  4: '슬픔이 깊어지는 것은 그 관계가 너에게 소중했다는 뜻이야.',
  5: '배움을 찾기 시작했다는 것 자체가 회복의 신호야.',
  6: '미래를 그리고 있다면 충분히 회복하고 있는 거야.',
  7: '7일을 견뎌낸 너의 마음이 가장 정확한 답이야.',
};

export async function fetchCoolingCheckinGPTResponse(params: {
  day: number;
  checkinText: string;
}): Promise<string> {
  try {
    const data = await invokeWithTimeout<{ response: string }>(
      'cooling-checkin-response',
      params,
      6000,
    );
    return data.response;
  } catch {
    return CHECKIN_FALLBACK[params.day] ?? CHECKIN_FALLBACK[1];
  }
}

// ── 졸업 작별 문장 AI 응답 ──────────────────────────────────────────
const FAREWELL_FALLBACK =
  '그 마음으로 이별을 맺는 너의 모습이 가장 성숙한 마무리야. ' +
  '그렇게 정직한 마음으로 보내는 사람이 다시 행복해질 거야.';

export async function fetchGraduationFarewellResponse(params: {
  userId: string;
  coolingPeriodId: string;
  farewellMessage: string;
}): Promise<string> {
  try {
    const data = await invokeWithTimeout<{ response: string }>(
      'graduation-farewell-response',
      params,
      6000,
    );
    return data.response;
  } catch {
    return FAREWELL_FALLBACK;
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
  checkinMoods?: number[];    // 유예 기간 체크인 감정 점수 배열
  checkinNotes?: string[];    // 유예 기간 체크인 메모 배열
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
