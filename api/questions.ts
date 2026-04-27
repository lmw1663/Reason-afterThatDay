import { supabase } from './supabase';
import { OFFLINE_QUESTION_POOL } from '@/constants/questionPool';
import type { Question, AnsweredQuestion, QuestionStatus } from '@/store/useQuestionStore';

function toQuestion(row: Record<string, unknown>): Question {
  return {
    id: row.id as string,
    text: row.text as string,
    context: row.context as Question['context'],
    isActive: row.is_active as boolean,
    weight: row.weight as number,
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

export async function fetchAnsweredQuestions(userId: string): Promise<AnsweredQuestion[]> {
  const { data } = await supabase
    .from('question_responses')
    .select('question_id, response_value, question_status, updated_at')
    .eq('user_id', userId);

  return (data ?? []).map((row) => ({
    questionId: row.question_id as string,
    responseValue: row.response_value,
    status: row.question_status as QuestionStatus,
    updatedAt: row.updated_at as string,
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
