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
  | 'preference_toggled'
  // A/B 실험 할당 (X-4-3) — payload: { experiment_id, variant }
  | 'experiment_assigned'
  // D-4 자가 보고 연락 충동 1탭 — payload: {} (개인 식별 정보 0)
  | 'contact_urge_reported';

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
 * EventKind별 payload 키 화이트리스트 — 민감 정보(C-SSRS 답변·자해 사고 텍스트·
 * free_text·persona 코드 raw 등) 누출 방지를 위한 *런타임 게이트*.
 *
 * 정책:
 *  · 본 맵에 없는 키는 sanitizePayload에서 *조용히 제거*. 호출처 누락은 dev 콘솔
 *    경고로만 — 사용자 흐름을 절대 막지 않음 (telemetry 실패-안전 원칙)
 *  · 신규 키 추가는 *반드시* 본 맵 갱신 + 코드 리뷰. 키 추가 자체가 PII 위험 검토 트리거
 *  · persona는 *카테고리* (anonymizePersona 결과)만 — P-코드 raw는 차단
 *  · 빈 배열 = payload 미허용 (예: contact_urge_reported)
 */
const PAYLOAD_ALLOWLIST: Record<EventKind, readonly string[]> = {
  screen_view: [
    'screen',
    'persona_category',
    'day',                   // cooling 일자 (정수)
    'has_recommended',       // about-me 추천 카테고리 유무 (boolean)
    'has_recommended_track', // memories 추천 트랙 유무 (boolean)
  ],
  persona_branch_applied: [
    'screen',
    'branch',
    'persona_category',
    'secondary_emotion',
    'track_route',           // memories 추천 트랙 route (예: /memories/...)
  ],
  ai_response_success:    ['fn'],
  ai_response_fallback:   ['fn', 'reason'],
  crisis_modal_shown:     ['type'],
  preference_toggled:     ['key', 'next'],
  experiment_assigned:    ['experiment_id', 'variant'],
  contact_urge_reported:  [],
};

export function sanitizePayload(
  kind: EventKind,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const allow = PAYLOAD_ALLOWLIST[kind];
  const filtered: Record<string, unknown> = {};
  const dropped: string[] = [];
  for (const [k, v] of Object.entries(payload)) {
    if (allow.includes(k)) filtered[k] = v;
    else dropped.push(k);
  }
  if (dropped.length > 0 && typeof __DEV__ !== 'undefined' && __DEV__) {
    console.warn(
      `[telemetry] '${kind}' 이벤트의 비허용 키 차단: ${dropped.join(', ')}.`
      + ` allowlist: [${allow.join(', ') || '없음'}]`,
    );
  }
  return filtered;
}

/**
 * 단일 이벤트 기록. 옵트인 OFF·userId 부재면 silent skip.
 * 호출처 부담 없이 안전하게 어디서나 호출 가능 (firing-and-forget).
 *
 * 실패는 silent — 텔레메트리 장애가 사용자 흐름을 막지 않음.
 * payload는 sanitizePayload로 *EventKind별 화이트리스트*만 통과.
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

    const safePayload = sanitizePayload(kind, payload);

    await supabase.from('events').insert({
      user_id: userId,
      event_kind: kind,
      payload: safePayload,
      client_timestamp: new Date().toISOString(),
    });
  } catch {
    // silent fail — 텔레메트리 장애가 사용자 흐름을 막지 않음
  }
}
