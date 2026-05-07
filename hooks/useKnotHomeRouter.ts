/**
 * useKnotHomeRouter — F-followup-2
 *
 * 홈에서 매듭 트랙 관련 라우팅 결정을 *단일 priority resolver*로 통합.
 *
 * **이전 구조 (race 위험)**:
 *   useEffect#1 dueRitual    → /knot/revisit
 *   useEffect#2 cyclePrompt  → /knot/cycle-prompt   (dueRitual null 가드)
 *   useEffect#3 knotTrigger  → /knot/prompt        (위 둘 가드)
 *
 *   문제: useRevisitTrigger의 비동기 fetch가 *늦게 도착*하면 cyclePrompt/knotTrigger가
 *   먼저 push된 후 dueRitual이 도착해 또 push → 모달 stack 쌓임.
 *
 * **본 hook**: 세 trigger를 *한 번에* 평가하여 단일 KnotHomeRoute 반환. 호출자(홈)는
 * useFocusEffect + ref 가드로 *focused 상태에서만 1회 push*.
 *
 * 우선순위: revisit > cycle-prompt > knot-prompt
 *   (시기 정합 순 — 이미 매듭 경험한 사용자가 가장 우선, 그 다음 새 사이클·새 매듭)
 */

import { useCyclePromptTrigger } from './useCyclePromptTrigger';
import { useKnotTrigger } from './useKnotTrigger';
import { useRevisitTrigger } from './useRevisitTrigger';
import type { RitualType } from '@/utils/knotRevisit';

export type KnotHomeRoute =
  | { type: 'revisit'; id: string; ritualType: RitualType }
  | { type: 'cycle-prompt' }
  | { type: 'knot-prompt' }
  | null;

export function useKnotHomeRouter(): KnotHomeRoute {
  const { dueRitual } = useRevisitTrigger();
  const cyclePrompt = useCyclePromptTrigger();
  const knotTrigger = useKnotTrigger();

  if (dueRitual) {
    return { type: 'revisit', id: dueRitual.id, ritualType: dueRitual.ritualType };
  }
  if (cyclePrompt.needed) {
    return { type: 'cycle-prompt' };
  }
  if (knotTrigger.allowed) {
    return { type: 'knot-prompt' };
  }
  return null;
}

/**
 * KnotHomeRoute → 안정적인 라우팅 키 문자열.
 * useEffect deps에 객체가 들어가면 매 렌더 발화하므로, 유의미한 변경(타입·id)일 때만
 * 변하는 string key로 변환.
 */
export function knotHomeRouteKey(route: KnotHomeRoute): string | null {
  if (!route) return null;
  if (route.type === 'revisit') return `revisit:${route.id}`;
  return route.type;
}
