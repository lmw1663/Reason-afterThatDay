import { create } from 'zustand';
import { Direction } from './useJournalStore';

export type CompassVerdict =
  | 'strong_catch'
  | 'lean_catch'
  | 'undecided'
  | 'undecided_with_love'
  | 'undecided_with_resentment'
  | 'lean_let_go'
  | 'strong_let_go'
  | 'DANGER_OBSESSION';

export interface DecisionRecord {
  id: string;
  createdAt: string;
  direction: Direction;
  verdict: CompassVerdict;
  diffScore: number;
}

interface DecisionState {
  history: DecisionRecord[];
  latestVerdict: CompassVerdict | null;

  addDecision: (record: DecisionRecord) => void;
  setHistory: (history: DecisionRecord[]) => void;
}

export const useDecisionStore = create<DecisionState>((set) => ({
  history: [],
  latestVerdict: null,

  addDecision: (record) =>
    set((state) => ({
      history: [record, ...state.history],
      latestVerdict: record.verdict,
    })),

  setHistory: (history) =>
    set({ history, latestVerdict: history[0]?.verdict ?? null }),
}));
