// 일기 통합 큐 훅 — Q-3 + Q-5 보강
//
// `buildQueueSequence` 라우터에 데이터를 모아 전달하고, 큐 진행 상태를 관리.
// "다음에" 스킵은 AsyncStorage에 KST 날짜 단위로 저장 → 다음날 진입 시 우선 노출.
//
// 정책 SSOT: docs/journal-unified-queue.md
// 라우터: utils/journalQueueRouter.ts

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useSmartQuestion } from './useSmartQuestion';
import { useDecisionLockGuard } from './useDecisionLockGuard';
import { resolvePersona } from '@/utils/personaResolver';
import {
  buildQueueSequence,
  type QueueItem,
} from '@/utils/journalQueueRouter';
import {
  todayKstString,
  selectPriorityFromRecord,
  appendSkippedId,
  type SkipRecord,
} from '@/utils/journalQueueSkip';
import {
  fetchCurrentReflections,
  type ReflectionCategory,
} from '@/api/selfReflections';
import { fetchRelationshipProfile } from '@/api/relationship';
import type { Direction } from '@/store/useJournalStore';

// AsyncStorage 키 — userId별 단일 record. 날짜가 오늘이면 누적, 다른 날짜면 어제 잔재로 사용.
const SKIP_KEY = (userId: string) => `journal_queue_skipped_${userId}`;

async function clearSkipRecord(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(SKIP_KEY(userId));
  } catch {
    // silent
  }
}

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

interface FetchedQueueContext {
  recentlyServedAboutMe: ReflectionCategory[];
  prosConsAnsweredToday: { pros: boolean; cons: boolean };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

async function fetchQueueContext(userId: string, now: number): Promise<FetchedQueueContext> {
  const today = todayKstString(now);

  const [reflectionsResult, profileResult] = await Promise.allSettled([
    fetchCurrentReflections(userId),
    fetchRelationshipProfile(userId),
  ]);

  const recentlyServedAboutMe: ReflectionCategory[] = [];
  if (reflectionsResult.status === 'fulfilled') {
    for (const [category, reflection] of Object.entries(reflectionsResult.value)) {
      if (!reflection) continue;
      const createdMs = new Date(reflection.createdAt).getTime();
      if (now - createdMs <= SEVEN_DAYS_MS) {
        recentlyServedAboutMe.push(category as ReflectionCategory);
      }
    }
  }

  let prosConsAnsweredToday = { pros: false, cons: false };
  if (profileResult.status === 'fulfilled' && profileResult.value) {
    const { prosByDate, consByDate } = profileResult.value;
    prosConsAnsweredToday = {
      pros: (prosByDate?.[today]?.length ?? 0) > 0,
      cons: (consByDate?.[today]?.length ?? 0) > 0,
    };
  }

  return { recentlyServedAboutMe, prosConsAnsweredToday };
}

export interface UseJournalQueueResult {
  queue: QueueItem[];
  currentIndex: number;
  current: QueueItem | null;
  /** 큐 진행이 끝났는지 — 빈 큐도 즉시 done=true로 처리(redirect 가능). */
  done: boolean;
  /** 큐 빌드 시도가 완료됐는지(빈 큐 포함) — false면 아직 fetch/lock 평가 중. */
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
  const [contextLoaded, setContextLoaded] = useState(false);
  const [fetchedContext, setFetchedContext] = useState<FetchedQueueContext>({
    recentlyServedAboutMe: [],
    prosConsAnsweredToday: { pros: false, cons: false },
  });
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [built, setBuilt] = useState(false);

  // 더블탭/연타 직렬화용 가드
  const submittingRef = useRef(false);
  const skipQueueRef = useRef<Promise<void>>(Promise.resolve());
  // userId 변경 추적 — 이전 사용자 SkipRecord 정리 (디바이스 공유·재로그인 누수 차단)
  const prevUserIdRef = useRef<string | null>(null);

  // 1) AsyncStorage에서 어제 스킵 로드 (P1-6: TTL 1일 — selectPriorityFromRecord 내부에서 처리)
  // userId 변경 시 이전 사용자 record 정리 후 새 사용자 로드.
  useEffect(() => {
    if (!userId) {
      setSkipLoaded(true);
      return;
    }
    const prevUserId = prevUserIdRef.current;
    if (prevUserId && prevUserId !== userId) {
      clearSkipRecord(prevUserId).catch(() => {/* silent */});
    }
    prevUserIdRef.current = userId;
    loadSkipRecord(userId).then((rec) => {
      setPrioritySkippedIds(selectPriorityFromRecord(rec, todayKstString()));
      setSkipLoaded(true);
    });
  }, [userId]);

  // 2) 도메인 컨텍스트 fetch (recentlyServed about-me + prosConsAnsweredToday)
  useEffect(() => {
    if (!userId) {
      setContextLoaded(true);
      return;
    }
    fetchQueueContext(userId, Date.now())
      .then((ctx) => {
        setFetchedContext(ctx);
        setContextLoaded(true);
      })
      .catch(() => {
        // 실패 시 default(빈 배열·false)로 통과 — 보수적으로 default 곡선만 적용
        setContextLoaded(true);
      });
  }, [userId]);

  // 3) 큐 빌드 — 모든 입력 도착 후 1회. 빈 큐도 정상 결과로 인정.
  useEffect(() => {
    if (built) return;
    if (!skipLoaded || !contextLoaded) return;
    if (lockState === 'loading') return;

    const items = buildQueueSequence({
      persona: resolved.effective,
      guardOverlayPersona: resolved.guardOverlay,
      daysElapsed,
      decisionLocked: lockState === 'locked',
      smartQ: smartQResult?.question ?? null,
      recentlyServedAboutMe: fetchedContext.recentlyServedAboutMe,
      // memory는 도메인 테이블이 없어 7일 추적 불가 — 알려진 한계 (docs/journal-unified-queue.md)
      recentlyServedMemory: [],
      prosConsAnsweredToday: fetchedContext.prosConsAnsweredToday,
      prioritySkippedIds,
      seed: daysElapsed,
    });
    setQueue(items);
    setCurrentIndex(0);
    setBuilt(true);
  }, [
    built,
    skipLoaded,
    contextLoaded,
    lockState,
    resolved,
    daysElapsed,
    smartQResult,
    fetchedContext,
    prioritySkippedIds,
  ]);

  const current = queue[currentIndex] ?? null;
  const ready = built;
  const done = built && currentIndex >= queue.length;

  const markAnswered = useCallback(() => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setCurrentIndex((i) => Math.min(i + 1, queue.length));
    // 다음 렌더 사이클에 가드 해제
    setTimeout(() => {
      submittingRef.current = false;
    }, 0);
  }, [queue.length]);

  const markSkipped = useCallback(async () => {
    if (!userId || !current) return;
    if (submittingRef.current) return;
    submittingRef.current = true;

    // skip 저장 + 인덱스 진행 모두 chain 내부에서 직렬화. 다음 tick 더블탭이 들어와도
    // chain에 직렬 추가되어 두 번째 호출의 setCurrentIndex가 *첫 호출 완료 후* 한 칸만 진행.
    const itemId = current.id;
    skipQueueRef.current = skipQueueRef.current.then(async () => {
      try {
        const today = todayKstString();
        const rec = await loadSkipRecord(userId);
        const newRec = appendSkippedId(rec, itemId, today);
        await saveSkipRecord(userId, newRec);
      } finally {
        setCurrentIndex((i) => Math.min(i + 1, queue.length));
      }
    });

    try {
      await skipQueueRef.current;
    } finally {
      submittingRef.current = false;
    }
  }, [userId, current, queue.length]);

  return { queue, currentIndex, current, done, ready, markAnswered, markSkipped };
}
