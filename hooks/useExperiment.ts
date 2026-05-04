import { useEffect, useMemo } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { trackEvent } from '@/api/telemetry';
import { assignVariant, type VariantWeight } from '@/utils/experiment';

/**
 * A/B 실험 훅 (X-4-3) — userId 기반 deterministic 변형 + 첫 mount 시 할당 이벤트 기록.
 *
 * @param experimentId 실험 식별자 (snake_case)
 * @param variants 가중치 배열. 합이 1이 되도록 호출자가 보장
 *
 * 사용 예:
 *   const variant = useExperiment('me_card_emphasis', [
 *     { name: 'control', weight: 0.5 },
 *     { name: 'highlight', weight: 0.5 },
 *   ]);
 *   if (variant === 'highlight') { ... }
 *
 * 정합성: 같은 (userId, experimentId)는 항상 같은 변형. 옵트아웃 사용자도 변형은 결정되나
 * trackEvent('experiment_assigned')는 telemetry 옵트인 OFF 시 silent skip.
 */
export function useExperiment(experimentId: string, variants: VariantWeight[]): string {
  const userId = useUserStore((s) => s.userId);

  const variant = useMemo(
    () => assignVariant(userId, experimentId, variants),
    // variants 배열 참조 변경 시 재할당 — 호출자가 stable reference 유지 권장
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, experimentId],
  );

  useEffect(() => {
    if (!userId) return;
    trackEvent('experiment_assigned', { experiment_id: experimentId, variant });
  }, [userId, experimentId, variant]);

  return variant;
}
