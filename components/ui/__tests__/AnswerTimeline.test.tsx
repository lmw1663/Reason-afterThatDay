// Phase L-2 — AnswerTimeline 렌더 분기 회귀.

import { describe, it, expect } from 'vitest';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnswerTimeline, type TimelineEntry } from '@/components/ui/AnswerTimeline';

function render(props: React.ComponentProps<typeof AnswerTimeline>): string {
  return renderToStaticMarkup(React.createElement(AnswerTimeline, props));
}

const entry = (value: unknown, dPlus: number, recordedAt = '2026-04-01T00:00:00Z'): TimelineEntry => ({
  responseValue: value,
  recordedAt,
  dPlus,
});

describe('AnswerTimeline render', () => {
  it('빈 entries → 빈 출력', () => {
    const html = render({ questionText: '헤어진 이유', entries: [] });
    expect(html).toBe('');
  });

  it('formatter 결과 모두 null → 빈 출력', () => {
    const html = render({
      questionText: '헤어진 이유',
      entries: [entry(null, 5), entry('', 10), entry({}, 15)],
    });
    expect(html).toBe('');
  });

  it('valid entries → 모두 노출 + dPlus 라벨', () => {
    const html = render({
      questionText: '헤어진 이유',
      entries: [entry('대화 줄음', 5), entry('서로 바빴어', 12), entry('내가 변했어', 25)],
    });
    expect(html).toContain('대화 줄음');
    expect(html).toContain('서로 바빴어');
    expect(html).toContain('내가 변했어');
    expect(html).toContain('처음');
    expect(html).toContain('지금');
    expect(html).toContain('D+5');
    expect(html).toContain('D+12');
    expect(html).toContain('D+25');
  });

  it('단일 entry → "처음" 만 표시 (이상 케이스도 안전)', () => {
    const html = render({
      questionText: '헤어진 이유',
      entries: [entry('하나뿐', 5)],
    });
    expect(html).toContain('하나뿐');
    expect(html).toContain('처음');
  });

  it('변화 횟수 어휘 미노출', () => {
    const html = render({
      questionText: '헤어진 이유',
      entries: [entry('A', 5), entry('B', 10), entry('C', 15)],
    });
    expect(html).not.toMatch(/\d+번\s*바뀌/);
    expect(html).not.toContain('또');
    expect(html).not.toContain('자꾸');
  });
});
