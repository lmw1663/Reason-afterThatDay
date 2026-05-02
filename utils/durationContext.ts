import type { DurationRange } from '@/constants/duration';

const RANGE_LABEL: Record<DurationRange, string | null> = {
  under_1y: '1년이 안 되는',
  '1_to_3y': '1~3년 동안',
  '3_to_5y': '3~5년 동안',
  over_5y: '5년 넘게',
  skip: null,
};

export function applyDurationContext(
  question: string,
  duration: DurationRange | null,
): string {
  if (!duration || duration === 'skip') return question;
  const label = RANGE_LABEL[duration];
  if (!label) return question;
  return question.replace('연애할 때', `${label} 연애한`);
}

export function getDurationLabel(duration: DurationRange | null): string | null {
  if (!duration || duration === 'skip') return null;
  return RANGE_LABEL[duration];
}
