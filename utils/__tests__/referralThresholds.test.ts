import { describe, it, expect } from 'vitest';
import {
  getAllThresholds,
  getEnabledThresholds,
  getThresholdById,
  resolveResources,
  describePriority,
  getExternalEmergencyNumber,
  type UiPriority,
} from '@/utils/referralThresholds';
import { getAllHotlines } from '@/utils/crisisHotlines';
import thresholdsData from '@/resources/referral-thresholds.json';

// X-3 외부 의뢰 임계 — 구현계획 §6-3 8 트리거 정의 + crisis-hotlines.json 참조 정합성.
// 본 테스트는 *임계 정의의 무결성*을 잠금 — 자원 ID 오타·임계값 변경·priority 누락 즉시 알람.

describe('referralThresholds — 임계 정의 무결성 (구현계획 §6-3)', () => {
  it('총 8개 트리거 정의', () => {
    expect(getAllThresholds()).toHaveLength(8);
  });

  it('각 트리거 id는 unique', () => {
    const ids = getAllThresholds().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('모든 auto_show_resources id가 crisis-hotlines.json에 존재', () => {
    const hotlineIds = new Set(getAllHotlines().map((h) => h.id));
    for (const t of getAllThresholds()) {
      for (const resourceId of t.auto_show_resources) {
        expect(hotlineIds.has(resourceId), `${t.id}의 ${resourceId} hotline 누락`).toBe(true);
      }
    }
  });

  it('모든 ui_priority가 critical/high/moderate 중 하나', () => {
    const allowed: UiPriority[] = ['critical', 'high', 'moderate'];
    for (const t of getAllThresholds()) {
      expect(allowed).toContain(t.ui_priority);
    }
  });

  it('threshold_count는 양수', () => {
    for (const t of getAllThresholds()) {
      expect(t.threshold_count).toBeGreaterThan(0);
    }
  });
});

describe('referralThresholds — 핵심 정책 잠금', () => {
  it('C-SSRS q4~q6 양성 — critical + 119 + decision lock + 24h follow-up', () => {
    const t = getThresholdById('cssrs_q4_q6_positive');
    expect(t).not.toBeNull();
    expect(t!.ui_priority).toBe('critical');
    expect(t!.external_emergency).toBe('119');
    expect(t!.lock_decision_track).toBe(true);
    expect(t!.follow_up_push_24h).toBe(true);
    expect(t!.threshold_count).toBe(1);
  });

  it('C-SSRS q1~q3 양성 — 2회 누적 (1회 → 안내, 2회 → 의뢰 카드)', () => {
    const t = getThresholdById('cssrs_q1_q3_repeat');
    expect(t!.threshold_count).toBe(2);
    expect(t!.threshold_window_days).toBe(14);
    expect(t!.lock_decision_track).toBeUndefined();
  });

  it('PHQ-9 / GAD-7 ≥ 15 — 1회 high', () => {
    const phq = getThresholdById('phq9_severe');
    const gad = getThresholdById('gad7_severe');
    expect(phq!.ui_priority).toBe('high');
    expect(gad!.ui_priority).toBe('high');
    expect(phq!.threshold_count).toBe(1);
    expect(gad!.threshold_count).toBe(1);
  });

  it('ICG/PG-13 — D+90 min_days_elapsed 게이트', () => {
    const t = getThresholdById('icg_pg13_chronic_grief');
    expect(t!.min_days_elapsed).toBe(90);
    expect(t!.ui_priority).toBe('moderate');
  });

  it('P19 결정 번복 — 3회 누적 + decision_history 추적', () => {
    const t = getThresholdById('p19_decision_flip_repeat');
    expect(t!.threshold_count).toBe(3);
    expect(t!.tracked_table).toBe('decision_history');
  });

  it('P20 트라우마 본딩 — 분류 즉시 + women_emergency + trauma 자원', () => {
    const t = getThresholdById('p20_trauma_bonding_classified');
    expect(t!.threshold_count).toBe(1);
    expect(t!.auto_show_resources).toContain('women_emergency');
    expect(t!.auto_show_resources).toContain('trauma_specialist_referral');
  });

  it('P01 가스라이팅 — Q2+Q6 동시 양성 + 1366 + 한국성폭력상담소', () => {
    const t = getThresholdById('p01_gaslighting_pattern');
    expect(t!.auto_show_resources).toContain('women_emergency');
    expect(t!.auto_show_resources).toContain('sexual_violence_counseling');
  });
});

describe('referralThresholds — 헬퍼 동작', () => {
  it('getThresholdById — 존재 id', () => {
    expect(getThresholdById('cssrs_q4_q6_positive')).not.toBeNull();
  });

  it('getThresholdById — 미존재 id → null', () => {
    expect(getThresholdById('nonexistent_xxx')).toBeNull();
  });

  it('resolveResources — auto_show_resources를 Hotline 객체 배열로 해소', () => {
    const t = getThresholdById('cssrs_q4_q6_positive')!;
    const resources = resolveResources(t);
    expect(resources.length).toBe(t.auto_show_resources.length);
    expect(resources.every((h) => h.id && h.name)).toBe(true);
  });

  it('describePriority — 3 priority 모두 사람이 읽을 수 있는 설명', () => {
    expect(describePriority('critical')).toContain('차단');
    expect(describePriority('high')).toContain('진입 가능');
    expect(describePriority('moderate')).toContain('카드');
  });

  it('getExternalEmergencyNumber — C-SSRS critical만 119, 나머지 null', () => {
    const cssrs = getThresholdById('cssrs_q4_q6_positive')!;
    expect(getExternalEmergencyNumber(cssrs)).toBe('119');

    const phq = getThresholdById('phq9_severe')!;
    expect(getExternalEmergencyNumber(phq)).toBeNull();
  });
});

describe('referralThresholds — 메타·필드 형식 잠금', () => {
  // JSON top-level meta는 type 정의에 없으므로 Record로 직접 접근
  const meta = thresholdsData as unknown as Record<string, unknown>;

  it('_schema_version === 1 (변경 시 호환 갱신 필요)', () => {
    expect(meta._schema_version).toBe(1);
  });

  it('verified_at은 ISO 날짜 형식 (YYYY-MM-DD)', () => {
    expect(meta.verified_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('threshold_window_days는 number 또는 null만 허용', () => {
    for (const t of getAllThresholds()) {
      expect(t.threshold_window_days === null || typeof t.threshold_window_days === 'number').toBe(true);
    }
  });

  it('tracked_table은 P19에만 존재 (decision_history)', () => {
    const withTrack = getAllThresholds().filter((t) => t.tracked_table);
    expect(withTrack).toHaveLength(1);
    expect(withTrack[0].id).toBe('p19_decision_flip_repeat');
    expect(withTrack[0].tracked_table).toBe('decision_history');
  });
});

describe('referralThresholds — getEnabledThresholds (false trigger 차단)', () => {
  it('enabled=false인 PHQ-9·GAD-7·ICG/PG-13는 제외', () => {
    const ids = getEnabledThresholds().map((t) => t.id);
    expect(ids).not.toContain('phq9_severe');
    expect(ids).not.toContain('gad7_severe');
    expect(ids).not.toContain('icg_pg13_chronic_grief');
  });

  it('enabled 미지정 또는 true인 임계는 포함 (C-SSRS·P19·P20·P01)', () => {
    const ids = getEnabledThresholds().map((t) => t.id);
    expect(ids).toContain('cssrs_q4_q6_positive');
    expect(ids).toContain('cssrs_q1_q3_repeat');
    expect(ids).toContain('p19_decision_flip_repeat');
    expect(ids).toContain('p20_trauma_bonding_classified');
    expect(ids).toContain('p01_gaslighting_pattern');
  });

  it('비활성 임계는 phase_dependency 명시 (활성화 시점 추적)', () => {
    const disabled = getAllThresholds().filter((t) => t.enabled === false);
    for (const t of disabled) {
      expect(t.phase_dependency).toBeGreaterThan(0);
    }
  });
});

describe('referralThresholds — UI priority 분포 (안전성 검토)', () => {
  it('critical은 정확히 1건 (C-SSRS q4~q6) — 최소 한 화면 차단은 필수', () => {
    const critical = getAllThresholds().filter((t) => t.ui_priority === 'critical');
    expect(critical).toHaveLength(1);
    expect(critical[0].id).toBe('cssrs_q4_q6_positive');
  });

  it('lock_decision_track은 critical 트리거에만 (의도적 보수)', () => {
    for (const t of getAllThresholds()) {
      if (t.lock_decision_track) {
        expect(t.ui_priority).toBe('critical');
      }
    }
  });

  it('one_touch_call은 critical/high에만 (moderate는 권장 카드)', () => {
    for (const t of getAllThresholds()) {
      if (t.one_touch_call) {
        expect(['critical', 'high']).toContain(t.ui_priority);
      }
    }
  });
});
