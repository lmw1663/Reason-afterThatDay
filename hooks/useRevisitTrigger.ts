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
import { useCoolingStore } from '@/store/useCoolingStore';
import {
  fetchDueRevisits,
  markRevisitTriggered,
  type RevisitScheduleRow,
} from '@/api/knotRevisit';

/**
 * F-9 회상 의식 trigger — 홈 진입 시 due한 회상 1건 반환.
 *
 * F-12 P1-A 보강:
 *   1. cooling 진행 중엔 발화 차단 — 새 매듭 cooling 중 이전 매듭 회상이 발화되면
 *      "유예 중 일반 알림 전면 중지"(CLAUDE.md) 정책 위반.
 *   2. fetch 시점에 markRevisitTriggered 호출 — 라우팅 도중 앱 종료 시 무한 라우팅 차단.
 *      트레이드오프: 사용자가 화면을 *못 보고* 앱을 종료하면 그 회상은 손실. 다음 회상
 *      의식(D+60 등)이 또 오므로 수용 가능.
 */
export function useRevisitTrigger() {
  const userId = useUserStore((s) => s.userId);
  const coolingStatus = useCoolingStore((s) => s.status);
  const [dueRitual, setDueRitual] = useState<RevisitScheduleRow | null>(null);

  useEffect(() => {
    if (!userId) return;
    if (coolingStatus === 'cooling') return; // P1-A 유예 중 차단
    let cancelled = false;
    fetchDueRevisits(userId)
      .then(async (rows) => {
        if (cancelled || rows.length === 0) return;
        const next = rows[0];
        try {
          await markRevisitTriggered(next.id); // 무한 라우팅 차단 (P1-A)
        } catch (e) {
          console.warn('[revisit] markRevisitTriggered failed:', e);
        }
        if (!cancelled) setDueRitual(next);
      })
      .catch((e) => console.warn('[revisit] fetchDueRevisits failed:', e));
    return () => {
      cancelled = true;
    };
  }, [userId, coolingStatus]);

  return { dueRitual };
}
