import { describe, it, expect } from 'vitest';
import {
  composeAugmentedFreeText,
  formatAnswerLabel,
} from '@/utils/journalQueueCompose';
import type { QueueAnswerPayload } from '@/utils/journalQueueRouter';

function ans(overrides: Partial<QueueAnswerPayload>): QueueAnswerPayload {
  return {
    id: 'smartQ:x',
    kind: 'smartQ',
    text: 'sample',
    ...overrides,
  };
}

describe('formatAnswerLabel — kind별 라벨', () => {
  it('smartQ → 오늘의 질문', () => {
    expect(formatAnswerLabel(ans({ kind: 'smartQ' }))).toBe('오늘의 질문');
  });
  it('aboutMe → 나에 대해', () => {
    expect(formatAnswerLabel(ans({ kind: 'aboutMe' }))).toBe('나에 대해');
  });
  it('memory → 추억', () => {
    expect(formatAnswerLabel(ans({ kind: 'memory' }))).toBe('추억');
  });
  it('prosCons cons → 오늘 떠오른 단점', () => {
    expect(formatAnswerLabel(ans({ kind: 'prosCons', prosCons: 'cons' }))).toBe('오늘 떠오른 단점');
  });
  it('prosCons pros → 오늘 떠오른 장점', () => {
    expect(formatAnswerLabel(ans({ kind: 'prosCons', prosCons: 'pros' }))).toBe('오늘 떠오른 장점');
  });
});

describe('composeAugmentedFreeText — base + 큐 답변 합치기', () => {
  it('base 없고 답변 없음 → 빈 문자열', () => {
    expect(composeAugmentedFreeText(undefined, [])).toBe('');
  });
  it('base만 있음 → trim된 base 반환', () => {
    expect(composeAugmentedFreeText('  hello  ', [])).toBe('hello');
  });
  it('base + 답변 1개 → 두 블록 \\n\\n 결합', () => {
    const result = composeAugmentedFreeText('내 이야기', [
      ans({ kind: 'smartQ', text: '오늘은 그래' }),
    ]);
    expect(result).toBe('내 이야기\n\n[오늘의 질문] 오늘은 그래');
  });
  it('답변 여러 개 — 각 라벨 prefix + 빈 답변 제외', () => {
    const result = composeAugmentedFreeText('', [
      ans({ kind: 'smartQ', text: 'A' }),
      ans({ kind: 'aboutMe', text: '' }),  // 빈 답변 → 제외
      ans({ kind: 'memory', text: 'B' }),
      ans({ kind: 'prosCons', prosCons: 'cons', text: 'C' }),
    ]);
    expect(result).toBe(
      '[오늘의 질문] A\n\n[추억] B\n\n[오늘 떠오른 단점] C',
    );
  });
  it('답변 텍스트 trim', () => {
    const result = composeAugmentedFreeText('', [
      ans({ kind: 'smartQ', text: '   space   ' }),
    ]);
    expect(result).toBe('[오늘의 질문] space');
  });
});
