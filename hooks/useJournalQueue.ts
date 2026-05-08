// 일기 통합 큐 훅 — Q-3
//
// `buildQueueSequence` 라우터에 데이터를 모아 전달하고, 큐 진행 상태를 관리.
// "다음에" 스킵은 AsyncStorage에 KST 날짜 단위로 저장 → 다음날 진입 시 우선 노출.
//
// 정책 SSOT: docs/journal-unified-queue.md
// 라우터: utils/journalQueueRouter.ts

import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useSmartQuestion } from './useSmartQuestion';
import { useDecisionLockGuard } from './useDecisionLockGuard';
import { resolvePersona } from '@/utils/personaResolver';
import { buildQueueSequence, type QueueItem } from '@/utils/journalQueueRouter';
import {
  todayKstString,
  selectPriorityFromRecord,
  appendSkippedId,
  type SkipRecord,
} from '@/utils/journalQueueSkip';
import type { Direction } from '@/store/useJournalStore';

// AsyncStorage 키 — userId별 단일 record. 날짜가 오늘이면 누적, 다른 날짜면 어제 잔재로 사용.
const SKIP_KEY = (userId: string) => `journal_queue_skipped_${userId}`;

async function loadSkipRecord(userId: string): Promise<SkipRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(SKIP_KEY(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.date === 'string' && Array.isArray(parsed?.ids)) {
      return { date: parsed.date, ids: parsed.ids };
    }
    return null;
  } catch {
    return null;
  }
}

async function saveSkipRecord(userId: string, record: SkipRecord): Promise<void> {
  try {
    await AsyncStorage.setItem(SKIP_KEY(userId), JSON.stringify(record));
  } catch {
    // silent — 큐 진행은 그대로 가능. 다음날 우선노출이 안 될 수 있을 뿐.
  }
}

export interface UseJournalQueueResult {
  queue: QueueItem[];
  currentIndex: number;
  current: QueueItem | null;
  done: boolean;
  /** 큐 빌드 완료 여부 — false면 아직 데이터 fetch 중 */
  ready: boolean;
  markAnswered: () => void;
  markSkipped: () => Promise<void>;
}

export function useJournalQueue(currentDirection: Direction): UseJournalQueueResult {
  const userId = useUserStore((s) => s.userId);
  const daysElapsed = useUserStore((s) => s.daysElapsed) ?? 0;
  const personaPrimary = usePersonaStore((s) => s.primary);
  const personaSecondary = usePersonaStore((s) => s.secondary);
  const lockState = useDecisionLockGuard();

  const resolved = useMemo(
    () => resolvePersona(personaPrimary, personaSecondary),
    [personaPrimary, personaSecondary],
  );
  const smartQResult = useSmartQuestion('journal', currentDirection);

  const [prioritySkippedIds, setPrioritySkippedIds] = useState<Set<string>>(new Set());
  const [skipLoaded, setSkipLoaded] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1) AsyncStorage에서 어제 스킵 로드
  useEffect(() => {
    if (!userId) {
      setSkipLoaded(true);
      return;
    }
    loadSkipRecord(userId).then((rec) => {
      setPrioritySkippedIds(selectPriorityFromRecord(rec, todayKstString()));
      setSkipLoaded(true);
    });
  }, [userId]);

  // 2) 큐 빌드 — 한 번만. 데이터 변동에도 큐 자체는 안정적으로 유지 (UX 일관성).
  useEffect(() => {
    if (!skipLoaded) return;
    if (lockState === 'loading') return;
    if (queue.length > 0) return;

    const items = buildQueueSequence({
      persona: resolved.effective,
      guardOverlayPersona: resolved.guardOverlay,
      daysElapsed,
      decisionLocked: lockState === 'locked',
      smartQ: smartQResult?.question ?? null,
      // TODO(Q-5): selfReflections / memoryLog 7일 윈도우 fetch 후 주입
      recentlyServedAboutMe: [],
      recentlyServedMemory: [],
      // TODO(Q-5): 오늘 relationship_profile 업데이트 여부 확인
      prosConsAnsweredToday: { pros: false, cons: false },
      prioritySkippedIds,
      seed: daysElapsed,
    });
    setQueue(items);
  }, [
    skipLoaded,
    lockState,
    queue.length,
    resolved,
    daysElapsed,
    smartQResult,
    prioritySkippedIds,
  ]);

  const current = queue[currentIndex] ?? null;
  const done = skipLoaded && lockState !== 'loading' && queue.length > 0 && currentIndex >= queue.length;
  const ready = skipLoaded && lockState !== 'loading' && queue.length > 0;

  const markAnswered = useCallback(() => {
    setCurrentIndex((i) => i + 1);
  }, []);

  const markSkipped = useCallback(async () => {
    if (!userId || !current) return;
    const today = todayKstString();
    const rec = await loadSkipRecord(userId);
    const newRec = appendSkippedId(rec, current.id, today);
    await saveSkipRecord(userId, newRec);
    setCurrentIndex((i) => i + 1);
  }, [userId, current]);

  return { queue, currentIndex, current, done, ready, markAnswered, markSkipped };
}
