import { useState, useCallback } from 'react';
import { AppError, type AppErrorCode } from '@/constants/errors';

const ERROR_MESSAGES: Record<AppErrorCode, string> = {
  [AppError.AI_TIMEOUT]:        '응답이 조금 늦어. 잠깐 기다려줄래?',
  [AppError.AI_FAILED]:         '잠깐 연결이 안 됐어. 다시 시도해봐.',
  [AppError.RLS_DENIED]:        '접근 권한이 없어. 다시 로그인해봐.',
  [AppError.AUTH_REQUIRED]:     '로그인이 필요해.',
  [AppError.COOLING_ACTIVE]:    '이미 유예 기간이 진행 중이야.',
  [AppError.ALREADY_GRADUATED]: '이미 졸업했어.',
  [AppError.DUPLICATE_JOURNAL]: '오늘 일기는 이미 저장됐어.',
  [AppError.OFFLINE]:           '지금 오프라인이야. 나중에 자동으로 저장될 거야.',
  [AppError.PUSH_DENIED]:       '알림 권한이 없어. 설정에서 켜줄 수 있어.',
};

export function useErrorHandler() {
  const [errorMsg, setErrorMsg] = useState('');
  const [visible, setVisible] = useState(false);

  const showError = useCallback((e: unknown) => {
    const err = e as { code?: AppErrorCode; message?: string };
    const msg = err.code && ERROR_MESSAGES[err.code]
      ? ERROR_MESSAGES[err.code]
      : '잠깐 문제가 생겼어. 다시 시도해봐.';
    setErrorMsg(msg);
    setVisible(true);
  }, []);

  const hideError = useCallback(() => setVisible(false), []);

  return { errorMsg, visible, showError, hideError };
}
