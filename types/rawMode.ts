/**
 * 거칠게 모드 (P10 분노 지배형 전용 venting 모드) 인터페이스 — B-3
 *
 * 본 파일은 *타입 인터페이스만* 정의한다. 실제 화면(`app/journal/raw-mode.tsx`)과
 * 서버 카운터·DB 컬럼은 Phase D-5에서 구현.
 *
 * 핵심 안전 규칙:
 *  1. `secondaryEmotionShown=false` 상태로는 세션 종료 불가 (저장 차단)
 *  2. 1일 진입 횟수 ≤ 2 (`MAX_RAW_MODE_PER_DAY`) — 서버사이드 카운터로 강제
 *  3. venting 후 2차 정서 1개 선택 강제 (저장 가드)
 *
 * 임상 근거: 단순 카타르시스(venting)는 분노 회로를 강화함 (Bushman, 2002).
 *           2차 정서 탐색과 결합해야 통합적 처리(Greenberg EFT) 효과.
 *
 * 매트릭스 §2 C3 P10 행과 1:1 매핑.
 */

export const MAX_RAW_MODE_PER_DAY = 2 as const;

export type SecondaryEmotion =
  | 'sadness'      // 슬픔
  | 'fear'         // 두려움
  | 'hurt'         // 상처
  | 'shame'        // 수치
  | 'helplessness' // 무력감
  ;

export const SECONDARY_EMOTIONS: { code: SecondaryEmotion; label: string }[] = [
  { code: 'sadness',      label: '슬픔' },
  { code: 'fear',         label: '두려움' },
  { code: 'hurt',         label: '상처' },
  { code: 'shame',        label: '수치' },
  { code: 'helplessness', label: '무력감' },
];

export interface RawModeSession {
  startedAt: Date;
  ventText: string;
  /** 2차 정서 선택 카드를 사용자에게 노출했는가. false 상태로 세션 저장 금지. */
  secondaryEmotionShown: boolean;
  /** 사용자가 선택한 2차 정서. 미선택이면 저장 차단. */
  secondaryEmotionPicked?: SecondaryEmotion;
}

/**
 * 세션 저장 가능 여부 — 화면에서 onSave 호출 전 본 가드 사용.
 * Phase D-5에서 화면 구현 시 본 함수로 저장 분기.
 */
export function canSaveRawModeSession(session: RawModeSession): boolean {
  return session.secondaryEmotionShown && session.secondaryEmotionPicked !== undefined;
}

/**
 * 진입 한도 가드 — 서버사이드 카운터 조회 후 본 함수로 분기.
 *
 * Phase D-5 결합 가이드:
 *  1. `supabase/migrations/025_raw_mode.sql`에 `rpc_get_raw_mode_today_count(user_id uuid) returns int` 추가
 *  2. 화면 진입 직전 `await supabase.rpc('rpc_get_raw_mode_today_count', { user_id })` 호출
 *  3. 반환값을 본 함수에 넘겨 boolean으로 분기 (true=진입 허용 / false=일반 일기로 우회 안내)
 *
 * 클라이언트 단독으로 본 함수만 호출하면 카운터 우회 가능 — 반드시 RPC 결과를 인자로.
 */
export function canEnterRawMode(todayCount: number): boolean {
  return todayCount < MAX_RAW_MODE_PER_DAY;
}
