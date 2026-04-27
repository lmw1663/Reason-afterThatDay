import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { upsertJournalEntry } from '@/api/journal';

const QUEUE_KEY = 'offline_journal_queue';

export interface QueuedEntry {
  userId: string;
  moodScore: number;
  moodLabel: string[];
  direction: 'catch' | 'let_go' | 'undecided';
  freeText?: string;
  aiResponse?: string;
  queuedAt: string;
}

export async function enqueueJournalEntry(entry: QueuedEntry): Promise<void> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  const queue: QueuedEntry[] = raw ? JSON.parse(raw) : [];

  // 같은 날(userId 기준) 기존 항목 교체 — last-write-wins
  const today = new Date().toISOString().slice(0, 10);
  const filtered = queue.filter(
    (q) => !(q.userId === entry.userId && q.queuedAt.startsWith(today)),
  );
  filtered.push(entry);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
}

export async function flushOfflineQueue(): Promise<void> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) return;

  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return;

  const queue: QueuedEntry[] = JSON.parse(raw);
  if (!queue.length) return;

  const failed: QueuedEntry[] = [];

  for (const entry of queue) {
    try {
      await upsertJournalEntry(entry);
    } catch {
      failed.push(entry); // 실패한 항목은 다시 큐에 보관
    }
  }

  if (failed.length) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(failed));
  } else {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
}

export async function getQueuedCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? (JSON.parse(raw) as QueuedEntry[]).length : 0;
}
