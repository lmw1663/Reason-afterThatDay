/**
 * useKnotPolicy — F-7
 *
 * 페르소나 기반 매듭 정책(label·coolingDays·triggerAllowed·triggerDay)을
 * 화면 컴포넌트에서 사용하기 쉽게 묶은 hook.
 *
 * 사용 예 (graduation 어휘 교체):
 *   const { label, coolingDays } = useKnotPolicy();
 *   <Caption>{label} · 1 / 5</Caption>
 *   <Body>{coolingDays}일 유예 시작하기</Body>
 */

import { usePersonaStore } from '@/store/usePersonaStore';
import { resolvePersona } from '@/utils/personaResolver';
import { resolveKnotPolicy, type KnotPolicy } from '@/utils/knotPolicy';

export function useKnotPolicy(): KnotPolicy {
  const primary = usePersonaStore((s) => s.primary);
  const secondary = usePersonaStore((s) => s.secondary);
  return resolveKnotPolicy(resolvePersona(primary, secondary));
}
