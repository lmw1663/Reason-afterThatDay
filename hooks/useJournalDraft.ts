import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY = 'journal_draft';
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface JournalDraftMood {
  moodScore: number;
  moodLabel: string[];
  physicalSignals: string[];
  freeText: string;
}

export interface JournalDraft {
  step: 1 | 2 | 3;
  mood: JournalDraftMood;
  direction: {
    direction: 'catch' | 'let_go' | 'undecided' | null;
    affectionLevel: number;
  };
  question: {
    questionId?: string;
    answerText: string;
  };
  savedAt: number;
}

export function useJournalDraft() {
  const saveDraft = async (draft: JournalDraft): Promise<void> => {
    try {
      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // 저장 실패는 UX 차단 없이 무시
    }
  };

  const loadDraft = async (): Promise<JournalDraft | null> => {
    try {
      const raw = await AsyncStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft: JournalDraft = JSON.parse(raw);
      // 7일 초과 draft 자동 정리
      if (Date.now() - draft.savedAt > DRAFT_TTL_MS) {
        await AsyncStorage.removeItem(DRAFT_KEY);
        return null;
      }
      return draft;
    } catch {
      return null;
    }
  };

  const clearDraft = async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(DRAFT_KEY);
    } catch {
      // 무시
    }
  };

  return { saveDraft, loadDraft, clearDraft };
}
