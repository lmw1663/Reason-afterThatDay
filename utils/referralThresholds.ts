import thresholdsData from '@/resources/referral-thresholds.json';
import { getAllHotlines, type Hotline } from './crisisHotlines';

/**
 * 외부 의뢰 자동 임계 헬퍼 — X-3
 *
 * referral-thresholds.json은 신뢰의 단일 출처(SSOT). 본 헬퍼만 사용해 임계 트리거에 따른
 * 자원을 조회. 임계값/자원 매핑을 화면 코드에 하드코딩 금지 (CLAUDE.md 정신).
 *
 * crisis-hotlines.json의 hotline id를 참조하므로 본 모듈은 `crisisHotlines`에 의존.
 */

export type UiPriority = 'critical' | 'high' | 'moderate';

export interface ReferralThreshold {
  id: string;
  trigger: string;
  threshold_count: number;
  threshold_window_days: number | null;
  /** Phase 5 ICG/PG-13 등 — D+90 미만 평가 무의미 */
  min_days_elapsed?: number;
  /** decision_history 등 트리거 누적 추적 테이블 (P19) */
  tracked_table?: string;
  /** crisis-hotlines.json의 hotline id 참조 */
  auto_show_resources: string[];
  /** 119 등 hotline ID 외 직접 노출 번호 (C-SSRS critical 등) */
  external_emergency?: string;
  ui_priority: UiPriority;
  one_touch_call?: boolean;
  follow_up_push_24h?: boolean;
  /** B-1 안전 프로토콜 — 결정 트랙 자동 잠금 */
  lock_decision_track?: boolean;
  /**
   * 본 임계가 *현재 활성화*인지. 검사 도구·라이선스 미통합 시 false.
   * 호출자는 enabled=false인 임계를 trigger 평가에 포함하지 말 것 (false trigger 차단).
   * 기본값(필드 부재) = true.
   */
  enabled?: boolean;
  /** 활성화 의존 Phase. enabled=false인 경우 어느 Phase에 활성화될지 추적용. */
  phase_dependency?: number;
}

interface ReferralPayload {
  thresholds: ReferralThreshold[];
  ui_priority_levels: Record<UiPriority, string>;
}

const data = thresholdsData as unknown as ReferralPayload;

const THRESHOLD_BY_ID: Record<string, ReferralThreshold> = data.thresholds.reduce(
  (acc, t) => ({ ...acc, [t.id]: t }),
  {} as Record<string, ReferralThreshold>,
);

/** 모든 임계 정의 (enabled 무관) — admin/QA 화면용. */
export function getAllThresholds(): ReferralThreshold[] {
  return data.thresholds;
}

/**
 * 현재 *활성화*된 임계만 반환 — 런타임 트리거 평가용.
 * `enabled !== false` (즉 true 또는 미지정)인 임계만 통과 — false trigger 차단.
 * Phase 5 ICG/PG-13는 enabled=false라 자연 제외됨. PHQ-9·GAD-7는 D-1~D-6 활성화로 enabled=true.
 */
export function getEnabledThresholds(): ReferralThreshold[] {
  return data.thresholds.filter((t) => t.enabled !== false);
}

/** id로 임계 1건 조회. 없으면 null. */
export function getThresholdById(id: string): ReferralThreshold | null {
  return THRESHOLD_BY_ID[id] ?? null;
}

/**
 * 임계의 `auto_show_resources` (hotline id 배열)를 실제 Hotline 객체로 해소.
 * id가 crisis-hotlines.json에 없으면 *조용히 누락* — 임계 갱신 시 hotline 누락 알람은 별도 검증.
 */
export function resolveResources(threshold: ReferralThreshold): Hotline[] {
  const hotlines = getAllHotlines();
  const hotlineById: Record<string, Hotline> = hotlines.reduce(
    (acc, h) => ({ ...acc, [h.id]: h }),
    {} as Record<string, Hotline>,
  );
  return threshold.auto_show_resources
    .map((id) => hotlineById[id])
    .filter((h): h is Hotline => h !== undefined);
}

/**
 * UI priority별 사람이 읽을 수 있는 정책 설명.
 * 디자인 시스템·접근성 의사결정에 참조 (예: critical은 모달 강제, moderate는 카드).
 */
export function describePriority(priority: UiPriority): string {
  return data.ui_priority_levels[priority];
}

/**
 * 임계가 정의한 외부 비상 번호(예: '119').
 * hotline id 배열로 표현 불가능한 *외부 자원*만 명시 — UI에서 별도 큰 버튼 노출.
 */
export function getExternalEmergencyNumber(threshold: ReferralThreshold): string | null {
  return threshold.external_emergency ?? null;
}
