// Phase F — AnswerTimeline / FirstVsLatestCard 의 표시 결정 로직.
// 컴포넌트 자체는 react-native 라 jsdom 단위로 다루기 부담 — formatter 와 분기 논리만 검증.
// 실제 렌더 분기는 별도 RNTL 통합 테스트 도입 시 보강.

import { describe, it, expect } from 'vitest';
import { defaultPreviousAnswerFormatter } from '@/components/ui/answerFormatters';

// FirstVsLatestCard 는 다음 케이스에서 null 렌더:
//   · first 또는 latest 의 formatter 결과가 null
//   · 두 값이 같음 ("그대로네" 단정 회피)
// 이 분기를 helper 로 가시화해 단위 검증.
function shouldRenderCard(first: unknown, latest: unknown): boolean {
  const f = defaultPreviousAnswerFormatter(first);
  const l = defaultPreviousAnswerFormatter(latest);
  if (!f || !l) return false;
  return f !== l;
}

describe('FirstVsLatestCard 렌더 분기', () => {
  it('두 값 모두 의미 있고 다름 → 표시', () => {
    expect(shouldRenderCard('대화가 줄었어', '서로 바빴어')).toBe(true);
  });
  it('두 값이 같음 → 미표시', () => {
    expect(shouldRenderCard('대화가 줄었어', '대화가 줄었어')).toBe(false);
  });
  it('first null → 미표시', () => {
    expect(shouldRenderCard(null, '서로 바빴어')).toBe(false);
  });
  it('latest 빈 문자열 → 미표시', () => {
    expect(shouldRenderCard('대화', '   ')).toBe(false);
  });
  it('boolean 다름 → 표시 (그래/아니야)', () => {
    expect(shouldRenderCard(true, false)).toBe(true);
  });
});

// AnswerTimeline 은 entries 중 formatter 가 null 인 항목을 필터링.
// 빈 entries 또는 모두 null 이면 렌더 자체 안 함.
function visibleEntryCount(values: unknown[]): number {
  return values.filter((v) => defaultPreviousAnswerFormatter(v) != null).length;
}

describe('AnswerTimeline 표시 가능 항목 카운트', () => {
  it('모두 의미 있음 → 전체 표시', () => {
    expect(visibleEntryCount(['a', 'b', 'c'])).toBe(3);
  });
  it('null/빈 항목 섞임 → 의미 있는 것만 카운트', () => {
    expect(visibleEntryCount(['a', null, '', '   ', 'b'])).toBe(2);
  });
  it('빈 배열 → 0 (호출자가 0이면 렌더 스킵)', () => {
    expect(visibleEntryCount([])).toBe(0);
  });
});
