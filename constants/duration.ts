export const DURATION_OPTIONS = [
  { value: 'under_1y', label: '1년 미만' },
  { value: '1_to_3y', label: '1년 ~ 3년' },
  { value: '3_to_5y', label: '3년 ~ 5년' },
  { value: 'over_5y', label: '5년 이상' },
  { value: 'skip',    label: '말하기 어려워' },
] as const;

export type DurationRange = typeof DURATION_OPTIONS[number]['value'];

export const RANGE_TO_MONTHS_APPROX: Record<DurationRange, number | null> = {
  under_1y: 6,
  '1_to_3y': 24,
  '3_to_5y': 48,
  over_5y: 72,
  skip: null,
};
