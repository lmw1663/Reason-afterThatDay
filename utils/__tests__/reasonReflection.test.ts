// Phase H — pickReasonReflection 의 그룹화·필터·우선순위 회귀.

import { describe, it, expect } from 'vitest';
import { pickReasonReflection, type ReflectionEntry } from '@/utils/reasonReflection';

function entry(qid: string, value: string, recordedAt: string, dPlus: number | null = null): ReflectionEntry {
  return { questionId: qid, responseValue: value, recordedAt, dPlus };
}

describe('pickReasonReflection', () => {
  it('빈 history → null', () => {
    expect(pickReasonReflection([])).toBeNull();
  });

  it('1건만 있는 질문 → null (변화 없음)', () => {
    expect(pickReasonReflection([entry('a_breakup_reason', 'X', '2026-04-01T00:00:00Z')])).toBeNull();
  });

  it('2건이지만 같은 값 → null (의미적 노변화)', () => {
    const h = [
      entry('a_breakup_reason', '대화', '2026-04-01T00:00:00Z'),
      entry('a_breakup_reason', '대화', '2026-04-08T00:00:00Z'),
    ];
    expect(pickReasonReflection(h)).toBeNull();
  });

  it('값이 다른 2건 → first/latest 추출', () => {
    const h = [
      entry('a_breakup_reason', '대화 줄음', '2026-04-01T00:00:00Z', 5),
      entry('a_breakup_reason', '서로 바빴음', '2026-04-15T00:00:00Z', 19),
    ];
    const r = pickReasonReflection(h);
    expect(r?.questionId).toBe('a_breakup_reason');
    expect(r?.first.responseValue).toBe('대화 줄음');
    expect(r?.latest.responseValue).toBe('서로 바빴음');
    expect(r?.first.dPlus).toBe(5);
    expect(r?.latest.dPlus).toBe(19);
  });

  it('여러 질문 중 latest 가 가장 최근인 것 우승', () => {
    const h = [
      // qid_old: 변화는 있지만 latest 가 오래됨
      entry('qid_old', 'A', '2026-04-01T00:00:00Z'),
      entry('qid_old', 'B', '2026-04-05T00:00:00Z'),
      // qid_recent: 변화 + latest 가 더 최근
      entry('qid_recent', 'X', '2026-04-02T00:00:00Z'),
      entry('qid_recent', 'Y', '2026-04-20T00:00:00Z'),
    ];
    const r = pickReasonReflection(h);
    expect(r?.questionId).toBe('qid_recent');
  });

  it('빈 문자열·null 등 의미 없는 값은 후보 아님', () => {
    const h = [
      entry('q1', '', '2026-04-01T00:00:00Z'),
      entry('q1', '   ', '2026-04-08T00:00:00Z'),
    ];
    expect(pickReasonReflection(h)).toBeNull();
  });

  it('3건 이상이어도 first 와 latest 만 사용', () => {
    const h = [
      entry('a_breakup_reason', '처음', '2026-04-01T00:00:00Z'),
      entry('a_breakup_reason', '중간', '2026-04-05T00:00:00Z'),
      entry('a_breakup_reason', '최근', '2026-04-15T00:00:00Z'),
    ];
    const r = pickReasonReflection(h);
    expect(r?.first.responseValue).toBe('처음');
    expect(r?.latest.responseValue).toBe('최근');
  });
});
