import { create } from 'zustand';

export type Direction = 'catch' | 'let_go' | 'undecided';

export interface JournalEntry {
  id: string;
  userId: string;
  createdAt: string;
  moodScore: number;
  moodLabel: string[];
  direction: Direction;
  freeText?: string;
  aiResponse?: string;
}

interface JournalState {
  todayEntry: JournalEntry | null;
  entries: JournalEntry[];
  stats: {
    moodTrend: number[];       // 최근 7일 mood_score
    directionHistory: Direction[];
  } | null;

  setTodayEntry: (entry: JournalEntry) => void;
  setEntries: (entries: JournalEntry[]) => void;
  setStats: (stats: JournalState['stats']) => void;
  clearToday: () => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  todayEntry: null,
  entries: [],
  stats: null,

  setTodayEntry: (entry) => set({ todayEntry: entry }),
  setEntries: (entries) => set({ entries }),
  setStats: (stats) => set({ stats }),
  clearToday: () => set({ todayEntry: null }),
}));
