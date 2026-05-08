// Phase B — PreviousAnswerHint 렌더 분기 회귀.
// store 의 previousValue 가 falsy 면 아무것도 안 그리고, jsonb 다양한 타입을 포맷하는지 검증.
//
// react-native 컴포넌트는 jsdom 단위로 렌더하기 부담스러우므로 formatter 함수만 단위 테스트.
// 실제 렌더 분기는 별도 RNTL 통합 테스트가 도입될 때 보강.

import { describe, it, expect } from 'vitest';
import { defaultPreviousAnswerFormatter } from '@/components/ui/PreviousAnswerHint';

describe('defaultPreviousAnswerFormatter', () => {
  it('null/undefined → null', () => {
    expect(defaultPreviousAnswerFormatter(null)).toBeNull();
    expect(defaultPreviousAnswerFormatter(undefined)).toBeNull();
  });

  it('빈 문자열·공백 → null (hint 미표시 조건)', () => {
    expect(defaultPreviousAnswerFormatter('')).toBeNull();
    expect(defaultPreviousAnswerFormatter('   ')).toBeNull();
  });

  it('일반 문자열 → trim 후 반환', () => {
    expect(defaultPreviousAnswerFormatter('  대화가 줄었어  ')).toBe('대화가 줄었어');
  });

  it('boolean → 그래/아니야 (CLAUDE.md 반말 일관성)', () => {
    expect(defaultPreviousAnswerFormatter(true)).toBe('그래');
    expect(defaultPreviousAnswerFormatter(false)).toBe('아니야');
  });

  it('number → 문자열, NaN/Infinity 는 null', () => {
    expect(defaultPreviousAnswerFormatter(7)).toBe('7');
    expect(defaultPreviousAnswerFormatter(0)).toBe('0');
    expect(defaultPreviousAnswerFormatter(Number.NaN)).toBeNull();
    expect(defaultPreviousAnswerFormatter(Infinity)).toBeNull();
  });

  it('배열 → 콤마 join, 빈 항목 필터', () => {
    expect(defaultPreviousAnswerFormatter(['소통', '거리감'])).toBe('소통, 거리감');
    expect(defaultPreviousAnswerFormatter(['', null, '하나'])).toBe('하나');
    expect(defaultPreviousAnswerFormatter([])).toBeNull();
    expect(defaultPreviousAnswerFormatter([null, undefined, ''])).toBeNull();
  });

  it('객체 → null (호출자가 명시적 formatter 제공해야 함)', () => {
    expect(defaultPreviousAnswerFormatter({ a: 1 })).toBeNull();
  });
});
