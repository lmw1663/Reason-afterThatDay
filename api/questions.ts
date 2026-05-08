import { supabase } from './supabase';
import { OFFLINE_QUESTION_POOL } from '@/constants/questionPool';
import type {
  Question,
  AnsweredQuestion,
  QuestionStatus,
  QuestionFollowup,
  FollowupTrigger,
  QuestionCategory,
  DisplayType,
} from '@/store/useQuestionStore';

function toQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    text: row.text as string,
    context: row.context as Question['context'],
    isActive: row.is_active as boolean,
    weight: row.weight as number,
    // v2 메타 — 마이그 037 컬럼 미러. 모두 optional 이므로 컬럼 미존재 환경(롤백 직후)에서도 안전.
    category: (row.category as QuestionCategory | null | undefined) ?? null,
    displayType: (row.display_type as DisplayType | undefined) ?? 'free_text',
    options: row.options ?? null,
    revisitAfterDays: (row.revisit_after_days as number | null | undefined) ?? null,
    revisitWindowDays: (row.revisit_window_days as number | undefined) ?? 3,
    allowCooldownBypass: (row.allow_cooldown_bypass as boolean | undefined) ?? false,
  };
}

// 서버 우선, 실패 시 번들 폴백
export async function fetchQuestionPool(): Promise<Question[]> {
  try {
    const { data, error } = await supabase
      .from('question_pool')
      .select('*')
      .eq('is_active', true);
    if (error || !data?.length) return OFFLINE_QUESTION_POOL;
    return data.map(toQuestion);
  } catch {
    return OFFLINE_QUESTION_POOL;
  }
}

// 후속 그래프 — 마이그 038. RLS public read 라 인증 없이도 동작. 실패 시 빈 배열로 폴백.
export async function fetchQuestionFollowups(): Promise<QuestionFollowup[]> {
  try {
    const { data, error } = await supabase
      .from('question_followups')
      .select('id, parent_id, child_id, trigger_type, trigger_value, delay_hours, priority');
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id as string,
      parentId: row.parent_id as string,
      childId: row.child_id as string,
      triggerType: row.trigger_type as FollowupTrigger,
      triggerValue: (row as Record<string, unknown>).trigger_value ?? null,
      delayHours: ((row as Record<string, unknown>).delay_hours as number | undefined) ?? 0,
      priority: ((row as Record<string, unknown>).priority as number | undefined) ?? 5,
    }));
  } catch {
    return [];
  }
}

export async function fetchAnsweredQuestions(userId: string): Promise<AnsweredQuestion[]> {
  const { data } = await supabase
    .from('question_responses')
    .select('question_id, response_value, previous_value, response_count, question_status, updated_at')
    .eq('user_id', userId);

  return (data ?? []).map((row) => ({
    questionId: row.question_id as string,
    responseValue: row.response_value,
    previousValue: (row as Record<string, unknown>).previous_value ?? undefined,
    status: row.question_status as QuestionStatus,
    updatedAt: row.updated_at as string,
    responseCount: ((row as Record<string, unknown>).response_count as number | undefined) ?? 1,
  }));
}

export async function upsertQuestionResponse(params: {
  userId: string;
  questionId: string;
  responseType: string;
  responseValue: unknown;
  status?: QuestionStatus;
}): Promise<void> {
  await supabase.from('question_responses').upsert(
    {
      user_id: params.userId,
      question_id: params.questionId,
      response_type: params.responseType,
      response_value: params.responseValue,
      question_status: params.status ?? 'answered',
    },
    { onConflict: 'user_id,question_id' },
  );
}

export async function markQuestionShown(userId: string, questionId: string): Promise<void> {
  await supabase.from('question_responses').upsert(
    {
      user_id: userId,
      question_id: questionId,
      response_type: 'shown',
      response_value: {},
      question_status: 'shown',
    },
    { onConflict: 'user_id,question_id', ignoreDuplicates: true },
  );
}

// ============================================================
// 응답 history — 마이그 039
// 졸업 letter "처음 ↔ 지금" 비교, 매듭 archive 카테고리 묶음에 사용.
// recorded_at 오름차순 — 첫 row 가 최초 응답, 마지막 row 가 최신.
// ============================================================
export interface ResponseHistoryEntry {
  questionId: string;
  responseValue: unknown;
  recordedAt: string;
  sourceScreen: string | null;
  dPlus: number | null;
}

export async function fetchResponseHistory(
  userId: string,
  questionId: string,
): Promise<ResponseHistoryEntry[]> {
  const { data, error } = await supabase
    .from('question_response_history')
    .select('question_id, response_value, recorded_at, source_screen, d_plus')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .order('recorded_at', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => ({
    questionId: row.question_id as string,
    responseValue: row.response_value,
    recordedAt: row.recorded_at as string,
    sourceScreen: ((row as Record<string, unknown>).source_screen as string | null | undefined) ?? null,
    dPlus: ((row as Record<string, unknown>).d_plus as number | null | undefined) ?? null,
  }));
}

// Phase G — 카테고리 그룹별 응답 history 조회
//
// 졸업 letter 의 카테고리별 회상 입력(reason/regret/lesson 등)에 사용. question_pool 의
// category 컬럼(마이그 037)을 join 해서 해당 카테고리에 속한 사용자 응답 history 를 모두 반환.
// 한 카테고리 안에 여러 질문이 있을 수 있으므로 questionId 별로 first/latest 를 호출자가 추출.
export async function fetchResponseHistoryByCategory(
  userId: string,
  category: QuestionCategory,
): Promise<ResponseHistoryEntry[]> {
  // PostgREST 의 inner join — pool.category=$cat 인 question_id 만
  const { data, error } = await supabase
    .from('question_response_history')
    .select('question_id, response_value, recorded_at, source_screen, d_plus, question_pool!inner(category)')
    .eq('user_id', userId)
    .eq('question_pool.category', category)
    .order('recorded_at', { ascending: true });

  if (error || !data) return [];
  return data.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      questionId: r.question_id as string,
      responseValue: r.response_value,
      recordedAt: r.recorded_at as string,
      sourceScreen: (r.source_screen as string | null | undefined) ?? null,
      dPlus: (r.d_plus as number | null | undefined) ?? null,
    };
  });
}
