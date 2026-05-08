// Phase L-2 — FirstVsLatestCard 렌더 분기 회귀 (RNTL).
//
// react-test-renderer 가 React 19 + vitest 환경에서 host string 인식 못 하므로
// renderToStaticMarkup 으로 HTML 문자열 비교. tests/setup/reactNativeMock.ts 가
// RN 프리미티브를 'rn-view'/'rn-text' 커스텀 엘리먼트로 우회.
//
// 시각 정확도가 아닌 *조건부 렌더 분기* + *카피 노출 회귀* 검증.

import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FirstVsLatestCard } from '@/components/ui/FirstVsLatestCard';

function render(props: React.ComponentProps<typeof FirstVsLatestCard>): string {
  return renderToStaticMarkup(React.createElement(FirstVsLatestCard, props));
}

describe('FirstVsLatestCard render', () => {
  it('first 와 latest 동일 → 빈 출력 ("그대로네" 단정 회피)', () => {
    const html = render({
      questionText: '헤어진 이유',
      first: { value: '대화가 줄었어', dPlus: 5 },
      latest: { value: '대화가 줄었어', dPlus: 30 },
    });
    expect(html).toBe('');
  });

  it('first null → 빈 출력 (의미 없는 값 보호)', () => {
    const html = render({
      questionText: '헤어진 이유',
      first: { value: null, dPlus: 5 },
      latest: { value: '대화가 줄었어', dPlus: 30 },
    });
    expect(html).toBe('');
  });

  it('first 와 latest 다름 → 두 값 모두 노출', () => {
    const html = render({
      questionText: '헤어진 이유',
      first: { value: '대화가 줄었어', dPlus: 5 },
      latest: { value: '서로 바빴어', dPlus: 30 },
    });
    expect(html).toContain('대화가 줄었어');
    expect(html).toContain('서로 바빴어');
    expect(html).toContain('헤어진 이유');
    expect(html).toContain('처음');
    expect(html).toContain('지금');
    expect(html).toContain('D+5');
    expect(html).toContain('D+30');
  });

  it('boolean 다름 → 그래/아니야 변환', () => {
    const html = render({
      questionText: '바뀔 수 있어?',
      first: { value: true, dPlus: 5 },
      latest: { value: false, dPlus: 30 },
    });
    expect(html).toContain('그래');
    expect(html).toContain('아니야');
  });

  it('변화 횟수 어휘("N번 바뀌었어") 절대 미노출 (CLAUDE.md "단정 금지")', () => {
    const html = render({
      questionText: '헤어진 이유',
      first: { value: 'A', dPlus: 5 },
      latest: { value: 'B', dPlus: 30 },
    });
    expect(html).not.toMatch(/\d+번\s*바뀌/);
    expect(html).not.toContain('또 바뀌');
    expect(html).not.toContain('자꾸');
  });
});
