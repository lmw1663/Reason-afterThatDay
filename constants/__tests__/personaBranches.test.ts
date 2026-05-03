import { describe, it, expect } from 'vitest';
import {
  resolvePersonaPriority,
  isSelfForgivenessUnlocked,
  isSealRecommended,
  isDeclutterRecommended,
  isContinuingBondsRecommended,
  isEncounterPlanRecommended,
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
