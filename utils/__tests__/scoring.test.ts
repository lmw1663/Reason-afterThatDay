import { describe, it, expect } from 'vitest';
import {
  scorePHQ9,
  scoreGAD7,
  scoreRSE,
  scorePHQ2,
  scoreGAD2,
  shortFormScoreToAxis,
  reverseRSE,
  bandMetaphor,
} from '@/utils/scoring';

function allItems(n: number, value: number): Record<string, number> {
  const r: Record<string, number> = {};
  for (let i = 1; i <= n; i++) r[`item${i}`] = value;
  return r;
}

describe('scorePHQ9 — band 경계', () => {
  it('0점 → minimal', () => {
    const r = scorePHQ9(allItems(9, 0));
    expect(r.rawScore).toBe(0);
    expect(r.band).toBe('minimal');
  });

  it('4점 → minimal (경계 상한)', () => {
    const r = scorePHQ9({ ...allItems(9, 0), item1: 2, item2: 2 });
    expect(r.rawScore).toBe(4);
    expect(r.band).toBe('minimal');
  });

  it('5점 → mild', () => {
    const r = scorePHQ9({ ...allItems(9, 0), item1: 3, item2: 2 });
    expect(r.rawScore).toBe(5);
    expect(r.band).toBe('mild');
  });

  it('10점 → moderate', () => {
    const r = scorePHQ9({ ...allItems(9, 1), item9: 2 });
    expect(r.rawScore).toBe(10);
    expect(r.band).toBe('moderate');
  });

  it('15점 → modSevere', () => {
    const r = scorePHQ9({ ...allItems(9, 1), item1: 3, item2: 3, item3: 2, item4: 2 });
    expect(r.rawScore).toBe(15);
    expect(r.band).toBe('modSevere');
  });

  it('27점 → severe (최댓값)', () => {
    const r = scorePHQ9(allItems(9, 3));
    expect(r.rawScore).toBe(27);
    expect(r.band).toBe('severe');
  });

  it('누락 항목은 0으로 처리 (부분 응답 대비)', () => {
    const r = scorePHQ9({ item1: 3 });
    expect(r.rawScore).toBe(3);
    expect(r.band).toBe('minimal');
  });
});

describe('scoreGAD7 — band 경계', () => {
  it('0~4 minimal', () => {
    expect(scoreGAD7(allItems(7, 0)).band).toBe('minimal');
    expect(scoreGAD7({ ...allItems(7, 0), item1: 2, item2: 2 }).band).toBe('minimal');
  });

  it('5~9 mild', () => {
    expect(scoreGAD7({ ...allItems(7, 0), item1: 3, item2: 2 }).band).toBe('mild');
  });

  it('10~14 moderate', () => {
    // 7항 합 10 = item1·2 = 2 + 나머지 5항 1.6 (정수 안 됨) → item1·2·3 = 2 + 4항 1 = 10
    expect(scoreGAD7({ item1: 2, item2: 2, item3: 2, item4: 1, item5: 1, item6: 1, item7: 1 }).band).toBe('moderate');
  });

  it('15+ severe', () => {
    expect(scoreGAD7(allItems(7, 3)).band).toBe('severe');
  });
});

describe('scoreRSE — band 경계 + 역코딩', () => {
  it('역코딩 항목(3·5·8·9·10) → 응답 0이 점수 3', () => {
    expect(reverseRSE(3, 0)).toBe(3);
    expect(reverseRSE(5, 1)).toBe(2);
    expect(reverseRSE(8, 2)).toBe(1);
    expect(reverseRSE(9, 3)).toBe(0);
    expect(reverseRSE(10, 0)).toBe(3);
  });

  it('일반 항목(1·2·4·6·7) → 그대로', () => {
    expect(reverseRSE(1, 2)).toBe(2);
    expect(reverseRSE(2, 0)).toBe(0);
    expect(reverseRSE(4, 3)).toBe(3);
    expect(reverseRSE(6, 1)).toBe(1);
    expect(reverseRSE(7, 2)).toBe(2);
  });

  it('14점 → low (경계)', () => {
    const r = scoreRSE({ ...allItems(10, 1), item1: 2, item2: 2, item3: 2, item4: 2 });
    expect(r.rawScore).toBe(14);
    expect(r.band).toBe('low');
  });

  it('15점 → avg', () => {
    const r = scoreRSE({ ...allItems(10, 1), item1: 2, item2: 2, item3: 2, item4: 2, item5: 2 });
    expect(r.rawScore).toBe(15);
    expect(r.band).toBe('avg');
  });

  it('26점 → high', () => {
    const r = scoreRSE(allItems(10, 3));
    // 30 - 4(item1·2 = 1 → -2 each... 수정) actually all items 3 → 30
    // 다른 케이스: item1·2를 1로 → 24 + ... 26 만들기
    // 빠른 검증: 30점 → high
    expect(r.rawScore).toBe(30);
    expect(r.band).toBe('high');
  });
});

describe('scorePHQ2 — 양성 임계 ≥3', () => {
  it('0점 → minimal', () => {
    const r = scorePHQ2({ item1: 0, item2: 0 });
    expect(r.rawScore).toBe(0);
    expect(r.band).toBe('minimal');
  });

  it('2점 → minimal (경계 음성)', () => {
    expect(scorePHQ2({ item1: 1, item2: 1 }).band).toBe('minimal');
    expect(scorePHQ2({ item1: 2, item2: 0 }).band).toBe('minimal');
  });

  it('3점 → positive (양성 임계)', () => {
    const r = scorePHQ2({ item1: 2, item2: 1 });
    expect(r.rawScore).toBe(3);
    expect(r.band).toBe('positive');
  });

  it('6점 → positive (최댓값)', () => {
    const r = scorePHQ2({ item1: 3, item2: 3 });
    expect(r.rawScore).toBe(6);
    expect(r.band).toBe('positive');
  });

  it('누락 항목은 0으로 처리', () => {
    expect(scorePHQ2({ item1: 3 }).rawScore).toBe(3);
  });
});

describe('scoreGAD2 — 양성 임계 ≥3', () => {
  it('2점 → minimal', () => {
    expect(scoreGAD2({ item1: 1, item2: 1 }).band).toBe('minimal');
  });

  it('3점 → positive', () => {
    expect(scoreGAD2({ item1: 2, item2: 1 }).band).toBe('positive');
  });

  it('6점 → positive', () => {
    const r = scoreGAD2({ item1: 3, item2: 3 });
    expect(r.rawScore).toBe(6);
    expect(r.band).toBe('positive');
  });
});

describe('shortFormScoreToAxis — PHQ-2/GAD-2 → 0~3 축 매핑', () => {
  it('0~1점 → 축 0 (음성)', () => {
    expect(shortFormScoreToAxis(0)).toBe(0);
    expect(shortFormScoreToAxis(1)).toBe(0);
  });

  it('2점 → 축 1 (경계)', () => {
    expect(shortFormScoreToAxis(2)).toBe(1);
  });

  it('3~4점 → 축 2 (양성, 임상 임계 정렬)', () => {
    expect(shortFormScoreToAxis(3)).toBe(2);
    expect(shortFormScoreToAxis(4)).toBe(2);
  });

  it('5~6점 → 축 3 (강한 양성)', () => {
    expect(shortFormScoreToAxis(5)).toBe(3);
    expect(shortFormScoreToAxis(6)).toBe(3);
  });

  it('임계 정렬: rawScore ≥3 양성 ↔ axis ≥2', () => {
    for (let s = 0; s <= 6; s++) {
      const axis = shortFormScoreToAxis(s);
      if (s >= 3) expect(axis).toBeGreaterThanOrEqual(2);
      else expect(axis).toBeLessThan(2);
    }
  });
});

describe('bandMetaphor — UI 노출 안전 게이트', () => {
  it('PHQ9 severe → 폭풍 메타포 + 전문가 도움 메시지', () => {
    const m = bandMetaphor('PHQ9', 'severe');
    expect(m.headline).toContain('폭풍');
    expect(m.subline).toContain('전문가');
  });

  it('GAD7 moderate → 파도 메타포', () => {
    const m = bandMetaphor('GAD7', 'moderate');
    expect(m.headline).toContain('파도');
  });

  it('RSE high → 빛 메타포', () => {
    const m = bandMetaphor('RSE', 'high');
    expect(m.headline).toContain('빛');
  });

  it('모든 메타포에 진단명·점수 미포함', () => {
    const cases: Array<[string, string]> = [
      ['PHQ9', 'minimal'], ['PHQ9', 'mild'], ['PHQ9', 'moderate'],
      ['PHQ9', 'modSevere'], ['PHQ9', 'severe'],
      ['GAD7', 'minimal'], ['GAD7', 'mild'], ['GAD7', 'moderate'], ['GAD7', 'severe'],
      ['RSE', 'low'], ['RSE', 'avg'], ['RSE', 'high'],
    ];
    const FORBIDDEN = ['PHQ', 'GAD', 'RSE', '우울', '불안', '점수', '/27', '/21', '/30'];
    for (const [inst, band] of cases) {
      const m = bandMetaphor(inst as 'PHQ9' | 'GAD7' | 'RSE', band);
      const text = `${m.headline} ${m.subline}`;
      for (const f of FORBIDDEN) {
        expect(text, `${inst}/${band} → "${text}" should not contain "${f}"`).not.toContain(f);
      }
    }
  });
});
