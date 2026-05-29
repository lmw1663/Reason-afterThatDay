// 일기 통합 큐 — memory 카테고리 노출 추적 (순수 헬퍼 + AsyncStorage I/O).
//
// memory(추억 회상)는 aboutMe/prosCons와 달리 도메인 테이블이 없어 "최근 7일 응답" 추적이
// 불가능했다 → `recentlyServedMemory`가 늘 빈 배열로 전달돼 매 빌드마다 같은 1순위 카테고리
// (보통 'painful')만 반복 노출되는 한계가 있었다. 도메인 테이블 신설 대신, "다음에" 스킵 기록과
// 동일하게 AsyncStorage에 답한 카테고리+시각을 누적해 7일 회전을 복원한다.
// (로컬 단말 단위 — 기기 간 동기화는 비목표. 카테고리 회전 UX 한정.)
//
// 순수 헬퍼(prune/recent/append)는 store·네트워크 비의존 → 단위 테스트 가능.
//
// 정책 SSOT: docs/features/journal-unified-queue.md

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { JournalMemoryCategory } from './journalQueueRouter';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
/** 누적 상한 — 무한 누적 차단. 7일 윈도우라 보통 4개 이하지만 안전 상한. */
export const MEMORY_SERVED_MAX = 30;

export interface MemoryServedEntry {
  category: JournalMemoryCategory;
  /** epoch ms (응답 기록 시각). 7일 윈도우 비교용. */
  ts: number;
}

const KEY = (userId: string) => `journal_queue_memory_served_${userId}`;

/** 7일 윈도우 밖 항목을 버리고 상한으로 자름 — 순수. */
export function pruneMemoryServed(
  entries: readonly MemoryServedEntry[],
  now: number = Date.now(),
): MemoryServedEntry[] {
  const fresh = entries.filter((e) => now - e.ts <= SEVEN_DAYS_MS);
  return fresh.length > MEMORY_SERVED_MAX ? fresh.slice(-MEMORY_SERVED_MAX) : fresh;
}

/** 최근 7일 내 노출된 memory 카테고리 집합(중복 제거) — 순수. */
export function recentMemoryCategories(
  entries: readonly MemoryServedEntry[],
  now: number = Date.now(),
): JournalMemoryCategory[] {
  const set = new Set<JournalMemoryCategory>();
  for (const e of entries) {
    if (now - e.ts <= SEVEN_DAYS_MS) set.add(e.category);
  }
  return [...set];
}

/** 새 노출 카테고리를 누적 — 순수(현재 배열 + 새 항목, prune 적용). */
export function appendMemoryServed(
  current: readonly MemoryServedEntry[],
  category: JournalMemoryCategory,
  now: number = Date.now(),
): MemoryServedEntry[] {
  return pruneMemoryServed([...current, { category, ts: now }], now);
}

// ───────── AsyncStorage I/O (실패 silent — 큐 진행 보호) ─────────

export async function loadMemoryServed(userId: string): Promise<MemoryServedEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is MemoryServedEntry =>
        (e?.category === 'happy' ||
          e?.category === 'miss' ||
          e?.category === 'painful' ||
          e?.category === 'growth') &&
        typeof e?.ts === 'number',
    );
  } catch {
    return [];
  }
}

export async function recordMemoryServed(
  userId: string,
  category: JournalMemoryCategory,
  now: number = Date.now(),
): Promise<void> {
  try {
    const current = await loadMemoryServed(userId);
    const next = appendMemoryServed(current, category, now);
    await AsyncStorage.setItem(KEY(userId), JSON.stringify(next));
  } catch {
    // silent — 다음날 회전이 안 될 수 있을 뿐, 큐 진행엔 영향 없음
  }
}

export async function clearMemoryServed(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY(userId));
  } catch {
    // silent
  }
}
