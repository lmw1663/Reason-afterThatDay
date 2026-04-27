export const AppError = {
  AI_TIMEOUT:        'AI_TIMEOUT',
  AI_FAILED:         'AI_FAILED',
  RLS_DENIED:        'RLS_DENIED',
  AUTH_REQUIRED:     'AUTH_REQUIRED',
  COOLING_ACTIVE:    'COOLING_ACTIVE',
  ALREADY_GRADUATED: 'ALREADY_GRADUATED',
  DUPLICATE_JOURNAL: 'DUPLICATE_JOURNAL',
  OFFLINE:           'OFFLINE',
  PUSH_DENIED:       'PUSH_DENIED',
} as const;

export type AppErrorCode = (typeof AppError)[keyof typeof AppError];
