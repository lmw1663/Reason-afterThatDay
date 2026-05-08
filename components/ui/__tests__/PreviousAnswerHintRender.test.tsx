// Phase L-2 — PreviousAnswerHint 렌더 분기 회귀 (RNTL).
//
// useQuestionStore 를 vi.mock 으로 우회 — 컴포넌트는 store selector 결과를 가져가므로
// 그 selector 가 반환할 값을 직접 제공.

import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const storeMockState: { answered: Record<string, { previousValue?: unknown; responseValue?: unknown } | undefined> } = {
  answered: {},
};

vi.mock('@/store/useQuestionStore', () => ({
  useQuestionStore: <T,>(selector: (s: typeof storeMockState) => T) => selector(storeMockState),
}));

import { PreviousAnswerHint } from '@/components/ui/PreviousAnswerHint';

function render(props: React.ComponentProps<typeof PreviousAnswerHint>, state: typeof storeMockState['answered']): string {
  storeMockState.answered = state;
  return renderToStaticMarkup(React.createElement(PreviousAnswerHint, props));
}

describe('PreviousAnswerHint render', () => {
  it('previousValue 없음 + fallback 비활성 → 빈 출력', () => {
    const html = render({ questionId: 'q' }, { q: { responseValue: '있는답', previousValue: undefined } });
    expect(html).toBe('');
  });

  it('previousValue 있으면 "저번엔 X였는데" 노출', () => {
    const html = render(
      { questionId: 'q' },
      { q: { previousValue: '대화 줄음', responseValue: '서로 바빴어' } },
    );
    expect(html).toContain('저번엔');
    expect(html).toContain('대화 줄음');
    expect(html).toContain('지금은 어때?');
  });

  it('Phase K-2 fallbackToLatest — previousValue 없을 때 responseValue 회상 ("전에 X")', () => {
    const html = render(
      { questionId: 'q', fallbackToLatest: true, fallbackPrefix: '전에' },
      { q: { responseValue: '그래', previousValue: undefined } },
    );
    expect(html).toContain('전에');
    expect(html).toContain('그래');
    expect(html).not.toContain('저번엔');
  });

  it('boolean true → 그래, false → 아니야 변환', () => {
    const trueHtml = render(
      { questionId: 'q' },
      { q: { previousValue: true, responseValue: false } },
    );
    expect(trueHtml).toContain('그래');

    const falseHtml = render(
      { questionId: 'q' },
      { q: { previousValue: false, responseValue: true } },
    );
    expect(falseHtml).toContain('아니야');
  });

  it('비난 어휘 미노출 (CLAUDE.md "방향 변화 비난 금지")', () => {
    const html = render(
      { questionId: 'q' },
      { q: { previousValue: 'A', responseValue: 'B' } },
    );
    expect(html).not.toContain('왜 또');
    expect(html).not.toContain('왜 자꾸');
    expect(html).not.toContain('마음이 또 바뀐');
  });

  it('format=card → questionId 가 같아도 prefix/suffix 모두 노출', () => {
    const html = render(
      { questionId: 'q', format: 'card' },
      { q: { previousValue: '값', responseValue: '값2' } },
    );
    expect(html).toContain('저번엔');
    expect(html).toContain('값');
  });
});
