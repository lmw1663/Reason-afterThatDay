import {
  getEnabledThresholds,
  resolveResources,
  getExternalEmergencyNumber,
  type ReferralThreshold,
} from './referralThresholds';
import type { Hotline } from './crisisHotlines';
import type { CrisisSeverity } from '@/api/safety';
import type { PersonaCode } from './personaClassifier';

/**
 * 외부 의뢰 임계 평가 — X-3-잔여 단계 1 (순수 함수)
 *
 * referral-thresholds.json의 enabled 임계만 평가. 사용자 데이터 snapshot을 입력받아
 * 어떤 임계가 발동했는지 판정. DB 호출은 별도 wrapper(api/safety.ts)에서 snapshot을
 * 채운 뒤 본 함수에 전달 — 본 모듈은 *DB 무관 순수 평가*라 단위 테스트 용이.
 *
 * 정책:
 *  - PHQ-9·GAD-7·ICG/PG-13(enabled=false)는 자동 제외 (false trigger 차단).
 *  - 시간 윈도우(threshold_window_days)는 snapshot이 *이미 그 윈도우로 필터링*된 데이터를 줘야.
 *    본 함수는 윈도우 자체 검증 X — snapshot의 책임 (호출자 명세).
 *  - 우선순위(critical > high > moderate)는 발동 *순서*로 정렬해 critical이 먼저.
 */

export interface UserSafetySnapshot {
  /** 최근 14일 이내 C-SSRS 응답의 severity 배열 (snapshot 측에서 14일 윈도우 적용 후 전달). */
  recentCrisisSeverities: CrisisSeverity[];
  /** 최근 30일 이내 결정 변화 횟수 (P19 트리거용 — snapshot 측 윈도우 적용 후). */
  recentDecisionFlipCount: number;
  /** 현재 분류된 페르소나 (primary + secondary, null 제외). */
  classifiedPersonas: PersonaCode[];
}

export interface ActiveThreshold {
  threshold: ReferralThreshold;
  resources: Hotline[];
  externalEmergency: string | null;
}

const PRIORITY_RANK: Record<ReferralThreshold['ui_priority'], number> = {
  critical: 0,
  high: 1,
  moderate: 2,
};

/**
 * snapshot으로 활성화된 임계 평가. 발동 임계만 priority 순으로 반환.
 */
export function evaluateActiveThresholds(snapshot: UserSafetySnapshot): ActiveThreshold[] {
  const enabled = getEnabledThresholds();
  const active: ActiveThreshold[] = [];

  for (const t of enabled) {
    if (!isTriggered(t, snapshot)) continue;
    active.push({
      threshold: t,
      resources: resolveResources(t),
      externalEmergency: getExternalEmergencyNumber(t),
    });
  }

  active.sort(
    (a, b) => PRIORITY_RANK[a.threshold.ui_priority] - PRIORITY_RANK[b.threshold.ui_priority],
  );
  return active;
}

/** 단일 임계가 snapshot으로 발동 조건을 충족하는지. */
export function isTriggered(t: ReferralThreshold, s: UserSafetySnapshot): boolean {
  switch (t.id) {
    case 'cssrs_q4_q6_positive':
      // urgent = q4/q5/q6 양성 (api/safety calcSeverity)
      return s.recentCrisisSeverities.some((sev) => sev === 'urgent');

    case 'cssrs_q1_q3_repeat': {
      // q1~q3 양성 = caution(q1) 또는 high(q2/q3) 또는 urgent(상위 포함)
      // threshold_count=2 누적 (window는 snapshot 책임)
      const count = s.recentCrisisSeverities.filter(
        (sev) => sev === 'caution' || sev === 'high' || sev === 'urgent',
      ).length;
      return count >= t.threshold_count;
    }

    case 'p19_decision_flip_repeat':
      return s.recentDecisionFlipCount >= t.threshold_count;

    case 'p20_trauma_bonding_classified':
      return s.classifiedPersonas.includes('P20');

    case 'p01_gaslighting_pattern':
      return s.classifiedPersonas.includes('P01');

    // PHQ/GAD/ICG는 enabled=false라 getEnabledThresholds에서 이미 제외됨 — 도달 불가.
    // 향후 enabled=true 시 별도 케이스 추가 (검사 통합 D-1 의존).
    default:
      return false;
  }
}
