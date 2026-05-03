import { describe, it, expect } from 'vitest';
import {
  // C3 일기
  isMiniJournalFirst,
  isRawModeAllowed,
  isEmptinessLabelsPriority,
  getJournalFreeTextPlaceholder,
  shouldShowShameGuiltEducation,
  // C4 나침반
  getCompassGateDays,
  isCompassDisabledByPersona,
  getCompassVerdictFooter,
  // C5 about-me 정렬
  sortAboutMeCategories,
  // C6 분석
  isPartnerProsBlocked,
  isPartnerConsBlocked,
  isAnalysisTrackBlockedByPersona,
  getProsConsItemLimit,
  // C7 추억
  isUnsentLetterRecommended,
  isMemoryGlamourBlocked,
  getMemoryReflectGateDays,
  shouldShowIntrusiveTrend,
  // C10 위기/푸시 (Ref-3)
  isLateNightPushSuppressed,
} from '@/constants/personaBranches';

// G-11: 화면별 페르소나 헬퍼 단위 테스트.
// 매트릭스 §2 셀별 분기 룰을 코드로 잠그는 회귀 알람.
// 본 파일은 *단일 페르소나 입력 → 단일 결과* 헬퍼 전수.
// (다중 페르소나 충돌·resolvePersonaPriority·게이트·G-7c는 personaBranches.test.ts)

// ───────── C3 일기 (G-3a / G-3b) ─────────

describe('C3 일기 — isMiniJournalFirst (매트릭스 §2 C3 P02 회피형 미니 default)', () => {
  it('P02 → true', () => expect(isMiniJournalFirst('P02')).toBe(true));
  it('P10 → false', () => expect(isMiniJournalFirst('P10')).toBe(false));
  it('null → false', () => expect(isMiniJournalFirst(null)).toBe(false));
});

describe('C3 일기 — isRawModeAllowed (매트릭스 §2 C3 P10 거칠게 모드)', () => {
  it('P10 → true', () => expect(isRawModeAllowed('P10')).toBe(true));
  it('P02 → false', () => expect(isRawModeAllowed('P02')).toBe(false));
  it('null → false', () => expect(isRawModeAllowed(null)).toBe(false));
});

describe('C3 일기 — isEmptinessLabelsPriority (매트릭스 §2 C3 P08 공허/시들음 라벨)', () => {
  it('P08 → true', () => expect(isEmptinessLabelsPriority('P08')).toBe(true));
  it('P10 → false', () => expect(isEmptinessLabelsPriority('P10')).toBe(false));
  it('null → false', () => expect(isEmptinessLabelsPriority(null)).toBe(false));
});

describe('C3 일기 — shouldShowShameGuiltEducation (G-3b 매트릭스 §2 C3 P14)', () => {
  it('P14 → true (외도 가해 후회 — 수치심 ≠ 죄책감 카드)', () => {
    expect(shouldShowShameGuiltEducation('P14')).toBe(true);
  });
  it('P10 → false', () => expect(shouldShowShameGuiltEducation('P10')).toBe(false));
  it('null → false', () => expect(shouldShowShameGuiltEducation(null)).toBe(false));
});

describe('C3 일기 — getJournalFreeTextPlaceholder (매트릭스 §2 C3)', () => {
  it('P04 — 갑작스러운 통보 → "내가 *아는 것*과 *상상한 것*을 나눠"', () => {
    expect(getJournalFreeTextPlaceholder('P04')).toContain('아는 것');
  });
  it('P09 — 헌신 소진 → "오늘 *너*에 대한"', () => {
    expect(getJournalFreeTextPlaceholder('P09')).toContain('너');
  });
  it('P17 — 강제 이별 → "그때 못 한 말"', () => {
    expect(getJournalFreeTextPlaceholder('P17')).toContain('못 한 말');
  });
  it('P10 — 분노 → "거칠게 써도 돼"', () => {
    expect(getJournalFreeTextPlaceholder('P10')).toContain('거칠게');
  });
  it('default(P02·null·기타) → "더 하고 싶은 말"', () => {
    expect(getJournalFreeTextPlaceholder('P02')).toContain('더 하고 싶은 말');
    expect(getJournalFreeTextPlaceholder(null)).toContain('더 하고 싶은 말');
    expect(getJournalFreeTextPlaceholder('P12')).toContain('더 하고 싶은 말');
  });
});

// ───────── C4 나침반 (G-4) ─────────

describe('C4 나침반 — getCompassGateDays (매트릭스 §2 C4 D+N 게이트)', () => {
  it('P02 회피형 → 10일', () => expect(getCompassGateDays('P02')).toBe(10));
  it('P04 갑작스러운 통보 → 14일', () => expect(getCompassGateDays('P04')).toBe(14));
  it('P07 첫 이별 → 21일', () => expect(getCompassGateDays('P07')).toBe(21));
  it('default(P10·P12·null) → 7일 baseline', () => {
    expect(getCompassGateDays('P10')).toBe(7);
    expect(getCompassGateDays('P12')).toBe(7);
    expect(getCompassGateDays(null)).toBe(7);
  });
});

describe('C4 나침반 — isCompassDisabledByPersona (매트릭스 §2 C4 P17 강제 이별)', () => {
  it('P17 → true (본인 결정 아님 → catch/let_go 무의미)', () => {
    expect(isCompassDisabledByPersona('P17')).toBe(true);
  });
  it('P10 → false', () => expect(isCompassDisabledByPersona('P10')).toBe(false));
  it('null → false', () => expect(isCompassDisabledByPersona(null)).toBe(false));
});

describe('C4 나침반 — getCompassVerdictFooter (매트릭스 §2 C4)', () => {
  it('P01 자기 판단 손상 → "너의 잘못이 아니야"', () => {
    expect(getCompassVerdictFooter('P01')).toContain('너의 잘못이 아니야');
  });
  it('P20 트라우마 본딩 → P01과 동일 footer', () => {
    expect(getCompassVerdictFooter('P20')).toBe(getCompassVerdictFooter('P01'));
  });
  it('P19 ROCD → "결정 안 해도 괜찮아"', () => {
    expect(getCompassVerdictFooter('P19')).toContain('결정 안 해도');
  });
  it('P14 외도 가해 → "다음 행동을 한 가지만"', () => {
    expect(getCompassVerdictFooter('P14')).toContain('다음 행동');
  });
  it('default(P10·P02·null) → null (footer 없음)', () => {
    expect(getCompassVerdictFooter('P10')).toBeNull();
    expect(getCompassVerdictFooter('P02')).toBeNull();
    expect(getCompassVerdictFooter(null)).toBeNull();
  });
});

// ───────── C5 about-me (G-5a / G-5b) ─────────

describe('C5 about-me — sortAboutMeCategories (매트릭스 §2 C5 페르소나별 우선)', () => {
  // 10 카테고리 (G-5b 신규 4종 포함). 본 테스트는 *순서 swap*만 검증.
  const defaultOrder = [
    'love_self',
    'ideal_match',
    'self_love',
    'strengths',
    'self_care_in_relationship',
    'self_care_alone',
    'reality_check',
    'body',
    'needs',
    'identity',
  ] as const;

  it('null → defaultOrder 그대로', () => {
    expect(sortAboutMeCategories(defaultOrder, null)).toEqual([...defaultOrder]);
  });

  it('PRIORITY 미매핑(P10·P03 등) → defaultOrder 그대로', () => {
    expect(sortAboutMeCategories(defaultOrder, 'P10')).toEqual([...defaultOrder]);
    expect(sortAboutMeCategories(defaultOrder, 'P03')).toEqual([...defaultOrder]);
  });

  it('P01 자기 판단 손상 → reality_check·self_love가 head로', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P01');
    expect(sorted[0]).toBe('reality_check');
    expect(sorted[1]).toBe('self_love');
    expect(sorted).toHaveLength(defaultOrder.length);
  });

  it('P02 회피형 → body·self_care_alone·self_care_in_relationship 순서', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P02');
    expect(sorted.slice(0, 3)).toEqual(['body', 'self_care_alone', 'self_care_in_relationship']);
  });

  it('P08 장기 권태 → identity·love_self·ideal_match 순서 (G-5b 정상화)', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P08');
    expect(sorted.slice(0, 3)).toEqual(['identity', 'love_self', 'ideal_match']);
  });

  it('P09 헌신 소진 → needs·self_love·strengths 순서', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P09');
    expect(sorted.slice(0, 3)).toEqual(['needs', 'self_love', 'strengths']);
  });

  it('P14 외도 가해 → self_care_alone만 head, identity는 default 끝(line 282 후순위)', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P14');
    expect(sorted[0]).toBe('self_care_alone');
    expect(sorted[sorted.length - 1]).toBe('identity'); // default 끝 보존
  });

  it('순서 swap 후에도 모든 카테고리 손실 없음 (head + tail = 전체)', () => {
    const sorted = sortAboutMeCategories(defaultOrder, 'P01');
    expect(new Set(sorted)).toEqual(new Set(defaultOrder));
  });
});

// ───────── C6 분석 pros·cons (G-6) ─────────

describe('C6 분석 — isPartnerProsBlocked (매트릭스 §2 C6 P01·P20 상대 미화 차단)', () => {
  it('P01 → true', () => expect(isPartnerProsBlocked('P01')).toBe(true));
  it('P20 → true', () => expect(isPartnerProsBlocked('P20')).toBe(true));
  it('P14 → false (P14는 cons만 차단, pros는 통과)', () => {
    expect(isPartnerProsBlocked('P14')).toBe(false);
  });
  it('P10 → false', () => expect(isPartnerProsBlocked('P10')).toBe(false));
  it('null → false', () => expect(isPartnerProsBlocked(null)).toBe(false));
});

describe('C6 분석 — isPartnerConsBlocked (매트릭스 §2 C6 P14·P01·P20 자기 정당화 차단)', () => {
  it('P14 → true (외도 가해 자기 정당화 차단)', () => {
    expect(isPartnerConsBlocked('P14')).toBe(true);
  });
  it('P01 → true', () => expect(isPartnerConsBlocked('P01')).toBe(true));
  it('P20 → true', () => expect(isPartnerConsBlocked('P20')).toBe(true));
  it('P10 → false', () => expect(isPartnerConsBlocked('P10')).toBe(false));
  it('null → false', () => expect(isPartnerConsBlocked(null)).toBe(false));
});

describe('C6 분석 — isAnalysisTrackBlockedByPersona (P01·P14·P20 트랙 전체 비활성)', () => {
  // P01·P14·P20은 pros 또는 cons 양쪽 차단되므로 분석 트랙 자체가 의미 없음.
  for (const p of ['P01', 'P14', 'P20'] as const) {
    it(`${p} → true`, () => expect(isAnalysisTrackBlockedByPersona(p)).toBe(true));
  }
  it('P02 → false', () => expect(isAnalysisTrackBlockedByPersona('P02')).toBe(false));
  it('P10 → false', () => expect(isAnalysisTrackBlockedByPersona('P10')).toBe(false));
  it('null → false', () => expect(isAnalysisTrackBlockedByPersona(null)).toBe(false));
});

describe('C6 분석 — getProsConsItemLimit (매트릭스 §2 C6 P19 ROCD ≤7)', () => {
  it('P19 → 7 (강박적 무한 추가 차단)', () => {
    expect(getProsConsItemLimit('P19')).toBe(7);
  });
  it('P10 → Infinity', () => expect(getProsConsItemLimit('P10')).toBe(Infinity));
  it('null → Infinity', () => expect(getProsConsItemLimit(null)).toBe(Infinity));
});

// ───────── C7 추억 (G-7a / G-7b / Ref-5) ─────────

describe('C7 추억 — isUnsentLetterRecommended (Ref-5 P02·P10·P17)', () => {
  for (const p of ['P02', 'P10', 'P17'] as const) {
    it(`${p} → true`, () => expect(isUnsentLetterRecommended(p)).toBe(true));
  }
  it('P14 → false', () => expect(isUnsentLetterRecommended('P14')).toBe(false));
  it('P12 → false', () => expect(isUnsentLetterRecommended('P12')).toBe(false));
  it('null → false', () => expect(isUnsentLetterRecommended(null)).toBe(false));
});

describe('C7 추억 — isMemoryGlamourBlocked (매트릭스 §2 C7 P01·P10·P14·P20 미화 차단)', () => {
  for (const p of ['P01', 'P10', 'P14', 'P20'] as const) {
    it(`${p} → true`, () => expect(isMemoryGlamourBlocked(p)).toBe(true));
  }
  it('P02 → false', () => expect(isMemoryGlamourBlocked('P02')).toBe(false));
  it('P09 → false', () => expect(isMemoryGlamourBlocked('P09')).toBe(false));
  it('null → false', () => expect(isMemoryGlamourBlocked(null)).toBe(false));
});

describe('C7 추억 — getMemoryReflectGateDays (매트릭스 §2 C7 P03 D+21)', () => {
  it('P03 → 21일 (불안형 미련 자극 차단)', () => {
    expect(getMemoryReflectGateDays('P03')).toBe(21);
  });
  it('P10 → 0 (게이트 없음)', () => expect(getMemoryReflectGateDays('P10')).toBe(0));
  it('null → 0', () => expect(getMemoryReflectGateDays(null)).toBe(0));
});

describe('C7 추억 — shouldShowIntrusiveTrend (G-7b P09 떠올랐어 카운터)', () => {
  it('P09 → true (헌신 소진 회복 진전 시각화)', () => {
    expect(shouldShowIntrusiveTrend('P09')).toBe(true);
  });
  it('P03 → false', () => expect(shouldShowIntrusiveTrend('P03')).toBe(false));
  it('null → false', () => expect(shouldShowIntrusiveTrend(null)).toBe(false));
});

// ───────── C10 위기/푸시 (Ref-3) ─────────

describe('C10 위기/푸시 — isLateNightPushSuppressed (Ref-3 P03 새벽 0~4시 차단)', () => {
  describe('P03 (불안형) — 시간 boundary', () => {
    it('hour=0 → true (새벽 시작)', () => {
      expect(isLateNightPushSuppressed('P03', 0)).toBe(true);
    });
    it('hour=2 → true', () => {
      expect(isLateNightPushSuppressed('P03', 2)).toBe(true);
    });
    it('hour=4 → true (새벽 끝)', () => {
      expect(isLateNightPushSuppressed('P03', 4)).toBe(true);
    });
    it('hour=5 → false (새벽 종료)', () => {
      expect(isLateNightPushSuppressed('P03', 5)).toBe(false);
    });
    it('hour=23 → false (전날 밤)', () => {
      expect(isLateNightPushSuppressed('P03', 23)).toBe(false);
    });
    it('hour=12 → false (정오)', () => {
      expect(isLateNightPushSuppressed('P03', 12)).toBe(false);
    });
  });

  describe('P03 외 — 항상 false (시간 무관)', () => {
    it('P10 + hour=2 → false', () => {
      expect(isLateNightPushSuppressed('P10', 2)).toBe(false);
    });
    it('P14 + hour=3 → false', () => {
      expect(isLateNightPushSuppressed('P14', 3)).toBe(false);
    });
    it('null + hour=2 → false (분류 미정도 미적용)', () => {
      expect(isLateNightPushSuppressed(null, 2)).toBe(false);
    });
  });
});

// ───────── 매트릭스 §2 페르소나별 *대표 셀* 통합 검증 ─────────
// 한 페르소나가 여러 화면에서 일관된 분기를 받는지 확인.
// 예: P14 → C3 shame≠guilt 카드 + C4 footer + C6 pros·cons 차단 + 자기 용서 게이트.

describe('통합 — 페르소나별 화면 횡단 일관성', () => {
  it('P14 외도 가해 — 4 화면 분기 일관성', () => {
    expect(shouldShowShameGuiltEducation('P14')).toBe(true);
    expect(getCompassVerdictFooter('P14')).toContain('다음 행동');
    expect(isPartnerConsBlocked('P14')).toBe(true);
    expect(isAnalysisTrackBlockedByPersona('P14')).toBe(true);
  });

  it('P01 자기 판단 손상 — 5 화면 분기 일관성', () => {
    expect(getCompassVerdictFooter('P01')).toContain('너의 잘못이 아니야');
    expect(isPartnerProsBlocked('P01')).toBe(true);
    expect(isPartnerConsBlocked('P01')).toBe(true);
    expect(isAnalysisTrackBlockedByPersona('P01')).toBe(true);
    expect(isMemoryGlamourBlocked('P01')).toBe(true);
  });

  it('P20 트라우마 본딩 — P01과 동일한 차단 패턴', () => {
    expect(getCompassVerdictFooter('P20')).toBe(getCompassVerdictFooter('P01'));
    expect(isPartnerProsBlocked('P20')).toBe(true);
    expect(isPartnerConsBlocked('P20')).toBe(true);
    expect(isAnalysisTrackBlockedByPersona('P20')).toBe(true);
    expect(isMemoryGlamourBlocked('P20')).toBe(true);
  });

  it('P02 회피형 — 미니 일기 + 신체 카테고리 + 늦은 나침반 + 부치지 않을 편지', () => {
    expect(isMiniJournalFirst('P02')).toBe(true);
    expect(getCompassGateDays('P02')).toBe(10);
    expect(isUnsentLetterRecommended('P02')).toBe(true);
    expect(getJournalFreeTextPlaceholder('P02')).toContain('더 하고 싶은 말'); // default
  });

  it('P10 분노 지배 — 거칠게 모드 + 미화 차단 + 부치지 않을 편지 + 분노 placeholder', () => {
    expect(isRawModeAllowed('P10')).toBe(true);
    expect(isMemoryGlamourBlocked('P10')).toBe(true);
    expect(isUnsentLetterRecommended('P10')).toBe(true);
    expect(getJournalFreeTextPlaceholder('P10')).toContain('거칠게');
  });

  it('P12 baseline — 모든 분기 default (특별 처리 없음)', () => {
    expect(isMiniJournalFirst('P12')).toBe(false);
    expect(isMemoryGlamourBlocked('P12')).toBe(false);
    expect(isPartnerProsBlocked('P12')).toBe(false);
    expect(getCompassGateDays('P12')).toBe(7);
    expect(getCompassVerdictFooter('P12')).toBeNull();
    expect(getProsConsItemLimit('P12')).toBe(Infinity);
  });
});

