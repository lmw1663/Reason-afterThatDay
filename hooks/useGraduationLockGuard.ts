import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { isAppLocked } from '@/api/safety';

export type GraduationLockState = 'loading' | 'unlocked' | 'locked';

/**
 * 매듭 트랙(graduation·knot) 진입 가드 — F-12
 *
 * C-SSRS 양성 사용자가 매듭 트랙에 진입하지 않도록 차단.
 * `safety_lockouts.graduation_locked`가 true이면 'locked' 반환.
 *
 * 사용처: hooks/useKnotTrigger.ts, hooks/useKnotPolicy.ts
 *
 * useDecisionLockGuard와 동일 패턴 — fail open(서버 장애 시 기본 흐름 보존).
 */
export function useGraduationLockGuard(): GraduationLockState {
  const { userId } = useUserStore();
  const [state, setState] = useState<GraduationLockState>('loading');

  useEffect(() => {
    if (!userId) {
      setState('unlocked');
      return;
    }
    isAppLocked(userId)
      .then((s) => setState(s.graduationLocked ? 'locked' : 'unlocked'))
      .catch((e) => {
        console.warn('[graduationLockGuard] isAppLocked failed:', e);
        setState('unlocked');
      });
  }, [userId]);

  return state;
}
