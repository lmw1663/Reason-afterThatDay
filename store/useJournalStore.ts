import { create } from 'zustand';

export type Direction = 'catch' | 'let_go' | 'undecided';

export interface JournalEntry {
  id: string;
  userId: string;
  createdAt: string;
  moodScore: number;
  moodLabel: string[];
  physicalSignals: string[];
  affectionLevel?: number | null;
  direction: Direction;
  freeText?: string;
  aiResponse?: string;
  isMiniMode?: boolean;
  isRawMode?: boolean;
  secondaryEmotion?: string | null;
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
  /**
   * 새 일기를 entries 맨 앞으로 prepend 하고 todayEntry로도 설정한다.
   * 같은 id가 이미 있으면 교체(서버 응답으로 로컬 임시 엔트리를 덮어쓰는 용도).
   */
  upsertEntry: (entry: JournalEntry) => void;
  setStats: (stats: JournalState['stats']) => void;
  clearToday: () => void;
}

export const useJournalStore = create<JournalState>((set) => ({
  todayEntry: null,
  entries: [],
  stats: null,

  setTodayEntry: (entry) => set({ todayEntry: entry }),
  setEntries: (entries) => set({ entries }),
  upsertEntry: (entry) =>
    set((state) => {
      // 서버 엔트리 도착 시 같은 저장 흐름의 낙관적 `local-` 임시 엔트리도 함께 제거.
      // id가 달라 id 필터만으로는 안 걸러져 오늘 엔트리가 중복 적재되던 문제
      // (홈 sparkline에서 끝 2점이 모두 오늘 값으로 보임).
      const dropLocals = !entry.id.startsWith('local-');
      const filtered = state.entries.filter(
        (e) => e.id !== entry.id && !(dropLocals && e.id.startsWith('local-')),
      );
      return { entries: [entry, ...filtered], todayEntry: entry };
    }),
  setStats: (stats) => set({ stats }),
  clearToday: () => set({ todayEntry: null }),
}));
