import { create } from 'zustand';

export type QuestionContext = 'journal' | 'analysis' | 'compass' | 'graduation';
export type QuestionStatus = 'shown' | 'answered' | 'stale' | 're_ask';

export interface Question {
  id: string;
  text: string;
  context: QuestionContext[];
  isActive: boolean;
  weight: number;
}

export interface AnsweredQuestion {
  questionId: string;
  responseValue: unknown;
  status: QuestionStatus;
  updatedAt: string;
}

interface QuestionState {
  pool: Question[];
  answered: Record<string, AnsweredQuestion>; // questionId → AnsweredQuestion

  setPool: (pool: Question[]) => void;
  markAnswered: (questionId: string, value: unknown) => void;
  markShown: (questionId: string) => void;
}

export const useQuestionStore = create<QuestionState>((set) => ({
  pool: [],
  answered: {},

  setPool: (pool) => set({ pool }),

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

  markAnswered: (questionId, value) =>
    set((state) => ({
      answered: {
        ...state.answered,
        [questionId]: {
          questionId,
          responseValue: value,
          status: 'answered',
          updatedAt: new Date().toISOString(),
        },
      },
    })),
}));
