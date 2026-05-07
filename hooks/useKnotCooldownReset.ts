/**
 * useKnotCooldownReset — F-12 P1-E
 *
 * usePersonaStore의 primary/secondary 변경을 watch하여 *비허용→허용* 이행 시
 * useKnotStore의 매듭 쿨다운(lastPromptDeclinedAt·lastTriggerCycle)을 리셋한다.
 *
 * 사례: 사용자가 P03(불안형) 시기에 매듭 권유가 차단됐다가 P12(안정형)으로 재추정된 경우,
 * 그 시점부터 매듭 권유 트리거가 발화 가능해야 한다. 이전 cycle에서 누적된 쿨다운 상태가
 * 잔존하면 *허용 페르소나가 됐는데도 권유 안 옴* 상황 발생.
 *
 * shouldResetKnotCooldownOnPersonaChange는 비허용→허용 *이행*만 true 반환 (단방향).
 *
 * 사용처: app/(tabs)/index.tsx 홈 (App-level watch가 충분 — 홈이 가장 자주 진입).
 */

import { useEffect, useRef } from 'react';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useKnotStore } from '@/store/useKnotStore';
import { resolvePersona } from '@/utils/personaResolver';
import { shouldResetKnotCooldownOnPersonaChange } from '@/utils/knotPolicy';
import type { PersonaCode } from '@/utils/personaClassifier';

export function useKnotCooldownReset() {
  const primary = usePersonaStore((s) => s.primary);
  const secondary = usePersonaStore((s) => s.secondary);
  const prevRef = useRef<{ primary: PersonaCode | null; secondary: PersonaCode | null }>({
    primary,
    secondary,
  });

  useEffect(() => {
    const prev = resolvePersona(prevRef.current.primary, prevRef.current.secondary);
    const next = resolvePersona(primary, secondary);
    if (shouldResetKnotCooldownOnPersonaChange(prev, next)) {
      useKnotStore.getState().clearCooldown();
    }
    prevRef.current = { primary, secondary };
  }, [primary, secondary]);
}
