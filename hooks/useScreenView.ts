import { useEffect } from 'react';
import { trackEvent } from '@/api/telemetry';

/**
 * 화면 마운트 시 screen_view 이벤트 1회 기록 (X-4-2).
 * trackEvent는 옵트인 OFF 시 silent skip이라 호출처 부담 없이 사용 가능.
 *
 * @param screen 화면 식별자 (snake_case 권장)
 * @param extra 추가 익명 컨텍스트 (페르소나 카테고리·D+N 구간 등). 민감 정보 금지.
 */
export function useScreenView(screen: string, extra?: Record<string, unknown>): void {
  useEffect(() => {
    trackEvent('screen_view', { screen, ...extra });
    // mount 시 1회만 — extra 변경으로 재발화 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);
}
