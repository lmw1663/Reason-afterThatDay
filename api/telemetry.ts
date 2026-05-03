import { supabase } from './supabase';
import { useUserStore } from '@/store/useUserStore';

// X-4 텔레메트리 — 1단계 인프라.
// 옵트인 default OFF + 매 호출마다 검사 (간단·정합). 인스트루멘테이션은 별 PR.

/**
 * 표준 이벤트 종류. 신규 종류 추가 시 본 union 갱신 — payload 스키마는 호출처 책임.
 *
 * 위기 응답·민감 정보(C-SSRS 답변·자해 사고 텍스트)는 payload에 절대 포함 금지.
 */
export type EventKind =
  // 화면 진입·이탈
  | 'screen_view'
  // 페르소나 분기 적용 (어떤 셀이 발동했는지 — 페르소나 코드는 *anonymized 카테고리*만)
  | 'persona_branch_applied'
  // AI 응답 결과 (성공/fallback)
  | 'ai_response_success'
  | 'ai_response_fallback'
  // 위기 모달 노출 (어떤 트리거로 열렸는지)
  | 'crisis_modal_shown'
  // 사용자 토글 변경 (suspension·telemetry)
  | 'preference_toggled';

export interface TelemetryStatus {
  optedIn: boolean;
  optedInAt: string | null;
}

const DEFAULT_STATUS: TelemetryStatus = { optedIn: false, optedInAt: null };

export async function getTelemetryStatus(userId: string): Promise<TelemetryStatus> {
  const { data, error } = await supabase
    .from('users')
    .select('telemetry_opted_in, telemetry_opted_in_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return DEFAULT_STATUS;
  return {
    optedIn: data.telemetry_opted_in ?? false,
    optedInAt: data.telemetry_opted_in_at ?? null,
  };
}

export async function setTelemetryOptIn(userId: string, optIn: boolean): Promise<void> {
  const update: Record<string, unknown> = {
    telemetry_opted_in: optIn,
    telemetry_opted_in_at: optIn ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('users').update(update).eq('id', userId);
  if (error) throw error;
}

/**
 * 단일 이벤트 기록. 옵트인 OFF·userId 부재면 silent skip.
 * 호출처 부담 없이 안전하게 어디서나 호출 가능 (firing-and-forget).
 *
 * 실패는 silent — 텔레메트리가 사용자 흐름을 막으면 안 됨.
 */
export async function trackEvent(
  kind: EventKind,
  payload: Record<string, unknown> = {},
): Promise<void> {
  const userId = useUserStore.getState().userId;
  if (!userId) return;

  try {
    const status = await getTelemetryStatus(userId);
    if (!status.optedIn) return;

    await supabase.from('events').insert({
      user_id: userId,
      event_kind: kind,
      payload,
      client_timestamp: new Date().toISOString(),
    });
  } catch {
    // silent fail — 텔레메트리 장애가 사용자 흐름을 막지 않음
  }
}
