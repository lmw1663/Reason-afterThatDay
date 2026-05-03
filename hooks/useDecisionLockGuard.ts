import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { isAppLocked } from '@/api/safety';

export type DecisionLockState = 'loading' | 'unlocked' | 'locked';

/**
 * 결정 트랙(분석·나침반) 진입 가드 — B-1
 *
 * URL 직접 진입 또는 잔존 router.push로 결정 트랙에 도달했을 때
 * decision_locked 상태면 화면을 그리지 않고 release로 우회.
 *
 * 사용처: app/analysis/_layout.tsx, app/compass/_layout.tsx
 *
 * 첫 마운트 시 'loading' → API 응답 후 'unlocked' 또는 'locked'.
 * 'loading' 동안에는 child를 렌더하지 않아 깜빡임 차단.
 */
export function useDecisionLockGuard(): DecisionLockState {
  const { userId } = useUserStore();
  const [state, setState] = useState<DecisionLockState>('loading');

  useEffect(() => {
    if (!userId) {
      // 익명 가입 전이면 잠금 조회 불가 — 보수적으로 unlocked 처리 (게이트 통과).
      setState('unlocked');
      return;
    }
    isAppLocked(userId)
      .then(s => setState(s.decisionLocked ? 'locked' : 'unlocked'))
      .catch(e => {
        console.warn('[lockGuard] isAppLocked failed:', e);
        // fail open — 안전 인프라 자체 장애 시 기본 흐름 보존
        setState('unlocked');
      });
  }, [userId]);

  return state;
}
