// X-4-3 A/B 실험 — deterministic 변형 할당.
//
// userId + experimentId를 해시해 [0, 1) 값으로 정규화 → 변형별 가중치로 분기.
// 같은 (userId, experimentId)는 항상 같은 변형 반환 — 사용자 경험 일관성.
//
// DB 변경 없이 events.payload에 { experiment_id, variant } 기록. 분석은 SQL 쿼리로.
//
// 본 모듈은 순수 함수 — assignVariant(userId, experimentId, variants). hook은 별 파일.
//
// ⚠️ 안전 핵심 컴포넌트(EmotionalCheckModal·B-1 C-SSRS·safety_lockouts·crisis_modal_shown)에는
// 실험 적용 금지 — 임상 안전 우선. 일반 UX·페르소나 분기 강조 등에만 사용.
//
// TODO Phase 5 이후 모집단 100명 초과 시 hash 알고리즘을 MurmurHash3·FNV-1a로 마이그레이션 검토.
// 현재 djb2-유사 폴리노미얼 hash + % 10000 modulus는 베타 규모(< 100명)에 충분.

export interface VariantWeight {
  /** 변형 식별자 — payload에 그대로 기록 */
  name: string;
  /** [0, 1] 사이 가중치. 합이 1이 되도록 호출자가 보장 (검증 X — 호출자 책임) */
  weight: number;
}

/**
 * 단일 사용자에게 deterministic 변형 할당.
 *
 * @param userId 사용자 ID. null이면 첫 변형 반환 (분류 미정 = control)
 * @param experimentId 실험 식별자 (snake_case 권장)
 * @param variants 가중치 배열. 순서대로 누적 가중치 분기. weight 합 ≠ 1이면 비례 정규화는 호출자 책임
 */
export function assignVariant(
  userId: string | null,
  experimentId: string,
  variants: VariantWeight[],
): string {
  if (!userId || variants.length === 0) {
    return variants[0]?.name ?? 'control';
  }

  // 단순 hash — userId + experimentId의 char code 합 % 1000을 [0, 1)로
  const seed = userId + ':' + experimentId;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const ratio = (hash % 10000) / 10000;

  let cumulative = 0;
  for (const v of variants) {
    cumulative += v.weight;
    if (ratio < cumulative) return v.name;
  }
  // 부동소수 잔여 — 마지막 변형
  return variants[variants.length - 1].name;
}
