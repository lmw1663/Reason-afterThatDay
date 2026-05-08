import { create } from 'zustand';

export type QuestionContext = 'journal' | 'analysis' | 'compass' | 'graduation';
export type QuestionStatus = 'shown' | 'answered' | 'stale' | 're_ask';

// Phase A — v2 §3 메타. 카테고리는 졸업·매듭 그룹 요약 대상에만 부여(nullable).
export type QuestionCategory =
  | 'pros' | 'cons' | 'reason' | 'regret' | 'lesson' | 'future'
  | 'direction' | 'need' | 'fear' | 'self_care';

export type DisplayType = 'pill' | 'free_text' | 'slider' | 'choice' | 'boolean';

// Phase A — 후속 질문 그래프 트리거 타입 (DB enum 미러링)
export type FollowupTrigger =
  | 'answer_changed' | 'answer_equals' | 'answer_yes' | 'answer_no' | 'always';

export interface Question {
  id: string;
  text: string;
  context: QuestionContext[];
  isActive: boolean;
  weight: number;
  // v2 메타 — 마이그 037
  category?: QuestionCategory | null;
  displayType?: DisplayType;
  options?: unknown;
  revisitAfterDays?: number | null;
  revisitWindowDays?: number;
  allowCooldownBypass?: boolean;
}

export interface QuestionFollowup {
  id: string;
  parentId: string;
  childId: string;
  triggerType: FollowupTrigger;
  triggerValue: unknown;
  delayHours: number;
  priority: number;
}

export interface AnsweredQuestion {
  questionId: string;
  responseValue: unknown;
  // 직전 응답값 — 마이그 039 의 previous_value 미러. UI prefill·"저번엔 X였는데" 프레임용.
  previousValue?: unknown;
  status: QuestionStatus;
  updatedAt: string;
  responseCount?: number;
}

interface QuestionState {
  pool: Question[];
  followups: QuestionFollowup[];
  answered: Record<string, AnsweredQuestion>;

  setPool: (pool: Question[]) => void;
  setFollowups: (followups: QuestionFollowup[]) => void;
  markAnswered: (questionId: string, value: unknown) => void;
  markShown: (questionId: string) => void;
}

// JSON 동등성 비교 — jsonb 응답값 변화 여부 판정용. 깊은 비교 대용.
function isSameValue(a: unknown, b: unknown): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return a === b;
  }
}

export const useQuestionStore = create<QuestionState>((set) => ({
  pool: [],
  followups: [],
  answered: {},

  setPool: (pool) => set({ pool }),
  setFollowups: (followups) => set({ followups }),

  markShown: (questionId) =>
    set((state) => ({
      answered: {
        ...state.answered,
        [questionId]: {
          questionId,
          responseValue: null,
          status: 'shown',
          updatedAt: new Date().toISOString(),
        },
      },
    })),

  // 서버 트리거(set_question_response_previous) 동작을 클라이언트도 동일하게 미러:
  // 값이 실제로 바뀌었을 때만 previousValue 회전 + responseCount 증가.
  markAnswered: (questionId, value) =>
    set((state) => {
      const prev = state.answered[questionId];
      const changed = prev == null ? true : !isSameValue(prev.responseValue, value);
      return {
        answered: {
          ...state.answered,
          [questionId]: {
            questionId,
            responseValue: value,
            previousValue: changed ? prev?.responseValue : prev?.previousValue,
            status: 'answered',
            updatedAt: new Date().toISOString(),
            responseCount: changed ? (prev?.responseCount ?? 0) + 1 : prev?.responseCount,
          },
        },
      };
    }),
}));
