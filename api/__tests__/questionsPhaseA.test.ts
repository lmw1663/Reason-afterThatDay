// Phase A — 신규 API 표면 회귀 방어
//   · fetchQuestionFollowups: row → camelCase 매핑, error 시 빈 배열 폴백
//   · fetchResponseHistory:   user_id+question_id 필터 + recorded_at asc 정렬
//   · fetchAnsweredQuestions: previous_value/response_count 컬럼 매핑
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';

vi.mock('@/api/supabase', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/api/supabase';
import {
  fetchQuestionFollowups,
  fetchResponseHistory,
  fetchAnsweredQuestions,
} from '@/api/questions';
import { applyChain, chainSelectOrder } from '@/tests/helpers/supabaseMock';

beforeEach(() => {
  vi.resetAllMocks();
});

// ------------------------------------------------------------
// fetchQuestionFollowups — .from(t).select(cols) 단일 호출, eq 없음
// ------------------------------------------------------------
describe('fetchQuestionFollowups', () => {
  it('row 매핑 (snake_case → camelCase) + 기본값 폴백', async () => {
    const chain = {
      select: vi.fn().mockResolvedValue({
        data: [
          {
            id: 'fu-1',
            parent_id: 'a_breakup_reason',
            child_id: 'a_fix_possible',
            trigger_type: 'answer_changed',
            trigger_value: null,
            delay_hours: 0,
            priority: 9,
          },
          {
            // delay_hours/priority null → 기본값 0/5
            id: 'fu-2',
            parent_id: 'c_honest_want',
            child_id: 'c_check_fear',
            trigger_type: 'always',
            trigger_value: { foo: 1 },
            delay_hours: null,
            priority: null,
          },
        ],
        error: null,
      }),
    };
    applyChain(supabase.from as Mock, chain);

    const list = await fetchQuestionFollowups();
    expect(list).toEqual([
      {
        id: 'fu-1',
        parentId: 'a_breakup_reason',
        childId: 'a_fix_possible',
        triggerType: 'answer_changed',
        triggerValue: null,
        delayHours: 0,
        priority: 9,
      },
      {
        id: 'fu-2',
        parentId: 'c_honest_want',
        childId: 'c_check_fear',
        triggerType: 'always',
        triggerValue: { foo: 1 },
        delayHours: 0,
        priority: 5,
      },
    ]);
    expect(supabase.from).toHaveBeenCalledWith('question_followups');
  });

  it('error → 빈 배열', async () => {
    const chain = {
      select: vi.fn().mockResolvedValue({ data: null, error: new Error('rls') }),
    };
    applyChain(supabase.from as Mock, chain);
    const list = await fetchQuestionFollowups();
    expect(list).toEqual([]);
  });

  it('throw → 빈 배열 (offline 폴백)', async () => {
    (supabase.from as Mock).mockImplementation(() => {
      throw new Error('network');
    });
    const list = await fetchQuestionFollowups();
    expect(list).toEqual([]);
  });
});

// ------------------------------------------------------------
// fetchResponseHistory — eq(user_id)+eq(question_id)+order asc
// ------------------------------------------------------------
describe('fetchResponseHistory', () => {
  it('eq 두 번 + order(recorded_at, asc) 호출 + row 매핑', async () => {
    const chain = chainSelectOrder([
      {
        question_id: 'a_breakup_reason',
        response_value: '대화가 줄었어',
        recorded_at: '2026-04-01T00:00:00Z',
        source_screen: null,
        d_plus: 5,
      },
      {
        question_id: 'a_breakup_reason',
        response_value: '서로 너무 바빴어',
        recorded_at: '2026-04-08T00:00:00Z',
        source_screen: 'analysis.reasons',
        d_plus: 12,
      },
    ]);
    applyChain(supabase.from as Mock, chain);

    const list = await fetchResponseHistory('user-1', 'a_breakup_reason');
    expect(supabase.from).toHaveBeenCalledWith('question_response_history');
    const eqArgs = chain.eq.mock.calls.map((c) => c[0]);
    expect(eqArgs).toContain('user_id');
    expect(eqArgs).toContain('question_id');
    expect(chain.order).toHaveBeenCalledWith('recorded_at', { ascending: true });
    expect(list).toEqual([
      {
        questionId: 'a_breakup_reason',
        responseValue: '대화가 줄었어',
        recordedAt: '2026-04-01T00:00:00Z',
        sourceScreen: null,
        dPlus: 5,
      },
      {
        questionId: 'a_breakup_reason',
        responseValue: '서로 너무 바빴어',
        recordedAt: '2026-04-08T00:00:00Z',
        sourceScreen: 'analysis.reasons',
        dPlus: 12,
      },
    ]);
  });

  it('error → 빈 배열', async () => {
    const chain = chainSelectOrder(null, new Error('rls'));
    applyChain(supabase.from as Mock, chain);
    const list = await fetchResponseHistory('user-1', 'q1');
    expect(list).toEqual([]);
  });
});

// ------------------------------------------------------------
// fetchAnsweredQuestions — previous_value / response_count 매핑 회귀
// ------------------------------------------------------------
describe('fetchAnsweredQuestions previous_value', () => {
  it('previous_value/response_count 컬럼 매핑', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [
          {
            question_id: 'a_breakup_reason',
            response_value: '서로 바빴어',
            previous_value: '대화가 줄었어',
            response_count: 2,
            question_status: 'answered',
            updated_at: '2026-04-08T00:00:00Z',
          },
          {
            // response_count null → 1 폴백
            question_id: 'j_today_mood',
            response_value: '괜찮은 하루',
            previous_value: null,
            response_count: null,
            question_status: 'answered',
            updated_at: '2026-04-08T00:00:00Z',
          },
        ],
        error: null,
      }),
    };
    applyChain(supabase.from as Mock, chain);

    const list = await fetchAnsweredQuestions('user-1');
    expect(list[0].previousValue).toBe('대화가 줄었어');
    expect(list[0].responseCount).toBe(2);
    // null previous_value → undefined (UI 에서 hint 미표시 조건)
    expect(list[1].previousValue).toBeUndefined();
    expect(list[1].responseCount).toBe(1);
  });
});
