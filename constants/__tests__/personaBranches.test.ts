import { describe, it, expect } from 'vitest';
import { resolvePersonaPriority } from '@/constants/personaBranches';
import type { PersonaCode } from '@/utils/personaClassifier';

// 페르소나 4유형 대표 코드 (constants/personaTypology.ts 매핑 기준)
//   A_safety:     P14, P20
//   B_contact:    P02, P08
//   C_regulation: P01, P03, P06, P10, P11, P19
//   D_meaning:    P04, P05, P07, P09, P12, P15, P16, P17, P18

// resolvePersonaPriority의 *직접* 동작을 잠금 — personaResolver R5 swap 결합도 분리.
// 본 파일이 깨지면 personaResolver.test.ts #8(P04+P10 swap)의 *근본 원인*을 즉시 특정 가능.
describe('resolvePersonaPriority — 의사코드(personaBranches.ts:200~211) 직접 검증', () => {
  describe('null 처리', () => {
    it('primary=null → primary', () => {
      expect(resolvePersonaPriority(null, 'P10')).toBe('primary');
    });
    it('secondary=null → primary', () => {
      expect(resolvePersonaPriority('P10', null)).toBe('primary');
    });
    it('둘 다 null → primary', () => {
      expect(resolvePersonaPriority(null, null)).toBe('primary');
    });
  });

  describe('A_safety 우선 — 주 A면 primary, 부 A면 secondary', () => {
    it('주 A(P14) + 부 D(P05) → primary', () => {
      expect(resolvePersonaPriority('P14', 'P05')).toBe('primary');
    });
    it('주 A(P20) + 부 C(P10) → primary', () => {
      expect(resolvePersonaPriority('P20', 'P10')).toBe('primary');
    });
    it('주 A(P14) + 부 A(P20) → primary (둘 다 A면 주 우선)', () => {
      expect(resolvePersonaPriority('P14', 'P20')).toBe('primary');
    });
    it('주 D(P05) + 부 A(P14) → secondary (A는 D보다 시급)', () => {
      expect(resolvePersonaPriority('P05', 'P14')).toBe('secondary');
    });
    it('주 C(P10) + 부 A(P14) → secondary', () => {
      expect(resolvePersonaPriority('P10', 'P14')).toBe('secondary');
    });
    it('주 B(P02) + 부 A(P20) → secondary', () => {
      expect(resolvePersonaPriority('P02', 'P20')).toBe('secondary');
    });
  });

  describe('D_meaning 후순위 — 부가 B/C면 부로 시급도 이동', () => {
    it('주 D(P04) + 부 C(P10) → secondary (R5 swap의 SSOT)', () => {
      expect(resolvePersonaPriority('P04', 'P10')).toBe('secondary');
    });
    it('주 D(P05) + 부 B(P02) → secondary', () => {
      expect(resolvePersonaPriority('P05', 'P02')).toBe('secondary');
    });
    it('주 D(P12) + 부 C(P19) → secondary', () => {
      expect(resolvePersonaPriority('P12', 'P19')).toBe('secondary');
    });
    it('주 D + 부 D → merged (둘 다 의미 작업, 시급도 동등)', () => {
      expect(resolvePersonaPriority('P04', 'P05')).toBe('merged');
    });
  });

  describe('B/C 정상화 — 부가 D면 주 유지', () => {
    it('주 B(P02) + 부 D(P05) → primary (의미 작업은 머리만 굴리는 회피 위험)', () => {
      expect(resolvePersonaPriority('P02', 'P05')).toBe('primary');
    });
    it('주 C(P10) + 부 D(P04) → primary (조절이 안 되면 의미 작업 불가)', () => {
      expect(resolvePersonaPriority('P10', 'P04')).toBe('primary');
    });
  });

  describe('B+C 동시 — merged (런타임 추가 신호 필요)', () => {
    it('주 C(P10) + 부 B(P02) → merged', () => {
      expect(resolvePersonaPriority('P10', 'P02')).toBe('merged');
    });
    it('주 B(P02) + 부 C(P10) → merged', () => {
      expect(resolvePersonaPriority('P02', 'P10')).toBe('merged');
    });
  });

  describe('동일 유형 — merged (그 외 폴스루)', () => {
    it('주 C + 부 C → merged', () => {
      expect(resolvePersonaPriority('P10', 'P03')).toBe('merged');
    });
    it('주 B + 부 B → merged', () => {
      expect(resolvePersonaPriority('P02', 'P08')).toBe('merged');
    });
  });

  describe('실 사용 케이스 — personaResolver의 R5 swap 회귀 잠금', () => {
    // 본 케이스가 깨지면 personaResolver.test.ts #8 P04+P10도 깨짐 — 근본 원인 추적용.
    const swapPairs: Array<[PersonaCode, PersonaCode, 'primary' | 'secondary' | 'merged']> = [
      ['P04', 'P10', 'secondary'], // D + C → swap
      ['P10', 'P04', 'primary'],   // C + D → 주 유지
      ['P05', 'P11', 'secondary'], // D + C → swap
      ['P11', 'P05', 'primary'],   // C + D → 주 유지
    ];
    for (const [p, s, expected] of swapPairs) {
      it(`${p} + ${s} → ${expected}`, () => {
        expect(resolvePersonaPriority(p, s)).toBe(expected);
      });
    }
  });
});
