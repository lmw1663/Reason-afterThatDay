import { describe, it, expect } from 'vitest';
import {
  resolvePersonaPriority,
  isSelfForgivenessUnlocked,
  isSealRecommended,
  isDeclutterRecommended,
  isContinuingBondsRecommended,
  isEncounterPlanRecommended,
  isContactUrgeChipBlocked,
  isJournalProsConsBlocked,
  getJournalProsConsRatio,
  getJournalQueueMaxLength,
} from '@/constants/personaBranches';
import type { PersonaCode } from '@/utils/personaClassifier';

// 페르소나 4유형 대표 코드 (constants/personaTypology.ts 매핑 기준)
//   A_safety:     P14, P20
//   B_contact:    P02, P08
//   C_regulation: P01, P03, P06, P10, P11, P19
//   D_meaning:    P04, P05, P07, P09, P12, P15, P16, P17, P18

// resolvePersonaPriority의 *직접* 동작을 잠금 — personaResolver R5 swap 결합도 분리.
// 본 파일이 깨지면 personaResolver.test.ts #8(P04+P10 swap)의 *근본 원인*을 즉시 특정 가능.
describe('resolvePersonaPriority — 의사코드(personaBranches.ts:200~211) 직접 검증', () => {
  describe('null 처리 — L222·L223', () => {
    it('primary=null → primary  // L222 !pType', () => {
      expect(resolvePersonaPriority(null, 'P10')).toBe('primary');
    });
    it('secondary=null → primary  // L223 !sType', () => {
      expect(resolvePersonaPriority('P10', null)).toBe('primary');
    });
    it('둘 다 null → primary  // L222 우선 발동', () => {
      expect(resolvePersonaPriority(null, null)).toBe('primary');
    });
  });

  describe('A_safety 우선 — L226(주 A) · L227(부 A)', () => {
    it('주 A(P14) + 부 D(P05) → primary  // L226', () => {
      expect(resolvePersonaPriority('P14', 'P05')).toBe('primary');
    });
    it('주 A(P20) + 부 C(P10) → primary  // L226', () => {
      expect(resolvePersonaPriority('P20', 'P10')).toBe('primary');
    });
    it('주 A(P14) + 부 A(P20) → primary  // L226 우선 (부 A는 도달 X)', () => {
      expect(resolvePersonaPriority('P14', 'P20')).toBe('primary');
    });
    it('주 D(P05) + 부 A(P14) → secondary  // L227', () => {
      expect(resolvePersonaPriority('P05', 'P14')).toBe('secondary');
    });
    it('주 C(P10) + 부 A(P14) → secondary  // L227', () => {
      expect(resolvePersonaPriority('P10', 'P14')).toBe('secondary');
    });
    it('주 B(P02) + 부 A(P20) → secondary  // L227', () => {
      expect(resolvePersonaPriority('P02', 'P20')).toBe('secondary');
    });
  });

  describe('D_meaning 후순위 — L230(D + B|C → secondary)', () => {
    it('주 D(P04) + 부 C(P10) → secondary  // L230 — R5 swap의 SSOT', () => {
      expect(resolvePersonaPriority('P04', 'P10')).toBe('secondary');
    });
    it('주 D(P05) + 부 B(P02) → secondary  // L230', () => {
      expect(resolvePersonaPriority('P05', 'P02')).toBe('secondary');
    });
    it('주 D(P12) + 부 C(P19) → secondary  // L230', () => {
      expect(resolvePersonaPriority('P12', 'P19')).toBe('secondary');
    });
    it('주 D + 부 D → merged  // L241 fall-through', () => {
      expect(resolvePersonaPriority('P04', 'P05')).toBe('merged');
    });
  });

  describe('B/C 정상화 — L233(B + D) · L234(C + D)', () => {
    it('주 B(P02) + 부 D(P05) → primary  // L233 — 의미 작업 머리만 굴리는 회피 위험', () => {
      expect(resolvePersonaPriority('P02', 'P05')).toBe('primary');
    });
    it('주 C(P10) + 부 D(P04) → primary  // L234 — 조절 안 되면 의미 작업 불가', () => {
      expect(resolvePersonaPriority('P10', 'P04')).toBe('primary');
    });
  });

  describe('B+C 동시 — L237(C+B) · L238(B+C)', () => {
    it('주 C(P10) + 부 B(P02) → merged  // L237', () => {
      expect(resolvePersonaPriority('P10', 'P02')).toBe('merged');
    });
    it('주 B(P02) + 부 C(P10) → merged  // L238', () => {
      expect(resolvePersonaPriority('P02', 'P10')).toBe('merged');
    });
  });

  describe('동일 유형 — L241 fall-through', () => {
    it('주 C + 부 C → merged  // L241', () => {
      expect(resolvePersonaPriority('P10', 'P03')).toBe('merged');
    });
    it('주 B + 부 B → merged  // L241', () => {
      expect(resolvePersonaPriority('P02', 'P08')).toBe('merged');
    });
  });

  describe('실 사용 케이스 — personaResolver의 R5 swap 회귀 잠금', () => {
    // 본 케이스가 깨지면 personaResolver.test.ts #8 P04+P10도 깨짐 — 근본 원인 추적용.
    const swapPairs: Array<[PersonaCode, PersonaCode, 'primary' | 'secondary' | 'merged']> = [
      ['P04', 'P10', 'secondary'], // D + C → swap (L230)
      ['P10', 'P04', 'primary'],   // C + D → 주 유지 (L234)
      ['P05', 'P11', 'secondary'], // D + C → swap (L230)
      ['P11', 'P05', 'primary'],   // C + D → 주 유지 (L234)
    ];
    for (const [p, s, expected] of swapPairs) {
      it(`${p} + ${s} → ${expected}`, () => {
        expect(resolvePersonaPriority(p, s)).toBe(expected);
      });
    }
  });
});

// 자기 용서 게이트 — Ref-4. P14만 D+60 잠금, 그 외 페르소나/null은 항상 unlocked.
// personaResolver R3 케이스(P12+P14 등)에서 effective=P14가 되면 본 게이트가 효과적인지 잠금.
describe('isSelfForgivenessUnlocked — P14 D+60 게이트 (personaBranches.ts:255~261)', () => {
  describe('P14 — D+60 boundary', () => {
    it('D+0 → false (잠금)', () => {
      expect(isSelfForgivenessUnlocked('P14', 0)).toBe(false);
    });
    it('D+59 → false (boundary 직전)', () => {
      expect(isSelfForgivenessUnlocked('P14', 59)).toBe(false);
    });
    it('D+60 → true (boundary, >= 비교)', () => {
      expect(isSelfForgivenessUnlocked('P14', 60)).toBe(true);
    });
    it('D+90 → true (충분히 경과)', () => {
      expect(isSelfForgivenessUnlocked('P14', 90)).toBe(true);
    });
  });

  describe('P14 외 — 항상 unlocked (게이트 미적용)', () => {
    it('P10 + D+0 → true', () => {
      expect(isSelfForgivenessUnlocked('P10', 0)).toBe(true);
    });
    it('P20 + D+0 → true (다른 HARMFUL이라도 P14 외엔 게이트 없음)', () => {
      expect(isSelfForgivenessUnlocked('P20', 0)).toBe(true);
    });
    it('null + D+0 → true (분류 미정도 미적용)', () => {
      expect(isSelfForgivenessUnlocked(null, 0)).toBe(true);
    });
  });
});

// G-7c 회상 의식 트랙 4종 — 매트릭스 §2 C7 P08·P15·P17·P18.
// 한 페르소나당 *최대 1개 트랙* 권장의 상호 배제 구조 잠금.
describe('G-7c 회상 의식 트랙 헬퍼 (personaBranches.ts G-7c 섹션)', () => {
  const tracks: Array<{
    name: string;
    fn: (p: PersonaCode | null) => boolean;
    persona: PersonaCode;
  }> = [
    { name: 'isSealRecommended', fn: isSealRecommended, persona: 'P08' },
    { name: 'isDeclutterRecommended', fn: isDeclutterRecommended, persona: 'P15' },
    { name: 'isContinuingBondsRecommended', fn: isContinuingBondsRecommended, persona: 'P17' },
    { name: 'isEncounterPlanRecommended', fn: isEncounterPlanRecommended, persona: 'P18' },
  ];

  for (const t of tracks) {
    describe(t.name, () => {
      it(`권장 페르소나(${t.persona}) → true`, () => {
        expect(t.fn(t.persona)).toBe(true);
      });
      it('비권장 페르소나(P10) → false', () => {
        expect(t.fn('P10')).toBe(false);
      });
      it('null → false', () => {
        expect(t.fn(null)).toBe(false);
      });
    });
  }

  it('상호 배제 — 각 권장 페르소나는 자기 트랙만 true (다른 3 트랙 모두 false)', () => {
    for (const t of tracks) {
      const others = tracks.filter((o) => o !== t);
      for (const other of others) {
        expect(other.fn(t.persona)).toBe(false);
      }
    }
  });
});

// G-6 연락 충동 보고 칩 노출 차단 — Ref-6.
// 차단: P14·P16·P17·P19·P20 (임상 안전 — docs/persona-contact-urge-policy.md)
describe('isContactUrgeChipBlocked — G-6 연락 충동 칩 차단 (personaBranches.ts Ref-6)', () => {
  const blocked: PersonaCode[] = ['P14', 'P16', 'P17', 'P19', 'P20'];

  describe('차단 페르소나 — true', () => {
    for (const p of blocked) {
      it(`${p} → true (차단)`, () => {
        expect(isContactUrgeChipBlocked(p)).toBe(true);
      });
    }
  });

  describe('비차단 페르소나 — false (노출)', () => {
    // 핵심 타겟 + 기타 안전 노출 페르소나
    const allowed: PersonaCode[] = [
      'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08',
      'P09', 'P10', 'P11', 'P12', 'P15', 'P18',
    ];
    for (const p of allowed) {
      it(`${p} → false (노출)`, () => {
        expect(isContactUrgeChipBlocked(p)).toBe(false);
      });
    }
  });

  it('null → false (baseline·미분류는 default 노출)', () => {
    expect(isContactUrgeChipBlocked(null)).toBe(false);
  });
});

// Ref-7 일기 통합 큐 — 정책 SSOT 잠금.
// 정책 문서: docs/journal-unified-queue.md
describe('일기 통합 큐 (personaBranches.ts Ref-7)', () => {
  describe('getJournalQueueMaxLength — 큐 길이 상한', () => {
    it('D+0 → 3 (회복 초기 부담 최소)', () => {
      expect(getJournalQueueMaxLength(0)).toBe(3);
    });
    it('D+7 → 3 (boundary inclusive)', () => {
      expect(getJournalQueueMaxLength(7)).toBe(3);
    });
    it('D+8 → 5 (확장)', () => {
      expect(getJournalQueueMaxLength(8)).toBe(5);
    });
    it('D+100 → 5 (상한 유지)', () => {
      expect(getJournalQueueMaxLength(100)).toBe(5);
    });
  });

  describe('isJournalProsConsBlocked — 장단점 풀 차단 페르소나', () => {
    const blocked: PersonaCode[] = ['P01', 'P14', 'P16', 'P19', 'P20'];
    for (const p of blocked) {
      it(`${p} → true (차단)`, () => {
        expect(isJournalProsConsBlocked(p)).toBe(true);
      });
    }

    const allowed: PersonaCode[] = [
      'P02', 'P03', 'P04', 'P05', 'P06', 'P07', 'P08',
      'P09', 'P10', 'P11', 'P12', 'P15', 'P17', 'P18',
    ];
    for (const p of allowed) {
      it(`${p} → false (통과)`, () => {
        expect(isJournalProsConsBlocked(p)).toBe(false);
      });
    }

    it('null → false (baseline)', () => {
      expect(isJournalProsConsBlocked(null)).toBe(false);
    });
  });

  describe('getJournalProsConsRatio — 페르소나·D+N별 단점 비율', () => {
    describe('default 곡선 (P02·P04·P06·P08)', () => {
      it('P02 D+0 → 0.7', () => {
        expect(getJournalProsConsRatio('P02', 0)).toBe(0.7);
      });
      it('P02 D+7 → 0.7 (boundary)', () => {
        expect(getJournalProsConsRatio('P02', 7)).toBe(0.7);
      });
      it('P02 D+8 → 0.6', () => {
        expect(getJournalProsConsRatio('P02', 8)).toBe(0.6);
      });
      it('P02 D+30 → 0.6 (boundary)', () => {
        expect(getJournalProsConsRatio('P02', 30)).toBe(0.6);
      });
      it('P02 D+31 → 0.5', () => {
        expect(getJournalProsConsRatio('P02', 31)).toBe(0.5);
      });
      it('P04·P06·P08도 동일 곡선', () => {
        expect(getJournalProsConsRatio('P04', 0)).toBe(0.7);
        expect(getJournalProsConsRatio('P06', 0)).toBe(0.7);
        expect(getJournalProsConsRatio('P08', 0)).toBe(0.7);
      });
    });

    describe('분노 강 곡선 (P10)', () => {
      it('D+0 → 0.8 (분노 표출)', () => {
        expect(getJournalProsConsRatio('P10', 0)).toBe(0.8);
      });
      it('D+8 → 0.7', () => {
        expect(getJournalProsConsRatio('P10', 8)).toBe(0.7);
      });
      it('D+31 → 0.6', () => {
        expect(getJournalProsConsRatio('P10', 31)).toBe(0.6);
      });
    });

    describe('장점 우세 곡선 (P05·P07·P09·P12·P15)', () => {
      it('P05 D+0 → 0.6', () => {
        expect(getJournalProsConsRatio('P05', 0)).toBe(0.6);
      });
      it('P12 D+8 → 0.5', () => {
        expect(getJournalProsConsRatio('P12', 8)).toBe(0.5);
      });
      it('P09 D+31 → 0.4 (장점 우세)', () => {
        expect(getJournalProsConsRatio('P09', 31)).toBe(0.4);
      });
    });

    describe('균형 곡선 (P03·P11·P18) — D+N 무관 0.5', () => {
      it('P03 D+0 → 0.5', () => {
        expect(getJournalProsConsRatio('P03', 0)).toBe(0.5);
      });
      it('P03 D+100 → 0.5 (변하지 않음)', () => {
        expect(getJournalProsConsRatio('P03', 100)).toBe(0.5);
      });
      it('P11 D+0 → 0.5', () => {
        expect(getJournalProsConsRatio('P11', 0)).toBe(0.5);
      });
      it('P18 D+30 → 0.5', () => {
        expect(getJournalProsConsRatio('P18', 30)).toBe(0.5);
      });
    });

    describe('Continuing Bonds (P17) — 장점 보존', () => {
      it('P17 D+0 → 0.3 (단점 ↓)', () => {
        expect(getJournalProsConsRatio('P17', 0)).toBe(0.3);
      });
      it('P17 D+100 → 0.3 (D+N 무관)', () => {
        expect(getJournalProsConsRatio('P17', 100)).toBe(0.3);
      });
    });

    describe('차단 페르소나 — fallback 0.5 (정상 흐름에선 호출되지 않음)', () => {
      it('P01 → 0.5', () => {
        expect(getJournalProsConsRatio('P01', 0)).toBe(0.5);
      });
      it('P14 → 0.5', () => {
        expect(getJournalProsConsRatio('P14', 30)).toBe(0.5);
      });
    });

    describe('null (baseline·미분류) — default 곡선', () => {
      it('null D+0 → 0.7', () => {
        expect(getJournalProsConsRatio(null, 0)).toBe(0.7);
      });
      it('null D+31 → 0.5', () => {
        expect(getJournalProsConsRatio(null, 31)).toBe(0.5);
      });
    });
  });
});
