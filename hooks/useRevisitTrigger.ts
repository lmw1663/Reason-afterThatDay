/**
 * useRevisitTrigger — F-9
 *
 * 홈 진입 시 due한 회상 의식 1건이 있으면 그 ritualType을 반환.
 * 푸시 인프라 의존 없이 클라이언트가 *due 시점에* 회상 의식 화면으로 진입 가능.
 *
 * 사용 예 (app/(tabs)/index.tsx):
 *   const { dueRitual } = useRevisitTrigger();
 *   useEffect(() => {
 *     if (dueRitual) router.push({ pathname: '/knot/revisit', params: { id: dueRitual.id } });
 *   }, [dueRitual?.id]);
 */

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { fetchDueRevisits, type RevisitScheduleRow } from '@/api/knotRevisit';

export function useRevisitTrigger() {
  const userId = useUserStore((s) => s.userId);
  const [dueRitual, setDueRitual] = useState<RevisitScheduleRow | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    fetchDueRevisits(userId)
      .then((rows) => {
        if (cancelled) return;
        // 가장 오래된 미발화 의식 1건만 반환 (큐 순차 처리)
        if (rows.length > 0) setDueRitual(rows[0]);
      })
      .catch((e) => console.warn('[revisit] fetchDueRevisits failed:', e));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { dueRitual };
}
