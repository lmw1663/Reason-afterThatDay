import { supabase } from './supabase';

/**
 * C-SSRS 안전 프로토콜 API — B-1
 *
 * crisis_assessments + safety_lockouts 테이블과 통신.
 * EmotionalCheckModal의 crisis_screen 흐름과 잠금 가드(_layout)에서 호출.
 */

export type CrisisSeverity = 'safe' | 'caution' | 'high' | 'urgent';
export type CrisisSource = 'onboarding' | 'modal_trigger' | 'periodic' | 'graduation';

export interface CrisisResponses {
  q1: boolean;  // 수동적 사고 ("죽고 싶다")
  q2: boolean;  // 적극적 자살 사고
  q3: boolean;  // 자살 수단 고려
  q4: boolean;  // 실행 의도
  q5: boolean;  // 구체적 계획
  q6: boolean;  // 최근 3개월 내 시도
}

export interface CrisisAssessmentInput {
  source: CrisisSource;
  responses: CrisisResponses;
}

export interface CrisisAssessmentResult {
  id: string;
  severity: CrisisSeverity;
  actions: string[];
}

export interface AppLockState {
  graduationLocked: boolean;
  decisionLocked: boolean;
  reason?: string;
  lockedAt?: string;
}

/**
 * Severity 산출 로직 — Columbia C-SSRS Triage:
 *  - q4·q5·q6 중 하나라도 양성 → urgent (즉시 개입)
 *  - q2·q3 중 하나라도 양성 → high (긴급)
 *  - q1 단독 양성 → caution (주의)
 *  - 모두 음성 → safe
 */
export function calcSeverity(r: CrisisResponses): CrisisSeverity {
  if (r.q4 || r.q5 || r.q6) return 'urgent';
  if (r.q2 || r.q3) return 'high';
  if (r.q1) return 'caution';
  return 'safe';
}

/**
 * 24시간 후 재확인 시점 계산.
 */
function followupDueAt(severity: CrisisSeverity): Date | null {
  if (severity === 'urgent' || severity === 'high') {
    const d = new Date();
    d.setHours(d.getHours() + 24);
    return d;
  }
  return null;
}

/**
 * C-SSRS 응답 기록 + severity 산출 + 자동 처치 트리거.
 *
 * 처치 액션:
 *  - urgent: lockout 생성(graduation·decision 모두 잠금) + 24h followup 푸시 예약
 *  - high:   lockout 생성(graduation·decision 잠금) + 24h followup 예약
 *  - caution: 핫라인 노출만 (잠금 없음)
 *  - safe:   기록만
 */
export async function recordCrisisAssessment(
  userId: string,
  input: CrisisAssessmentInput,
): Promise<CrisisAssessmentResult> {
  const severity = calcSeverity(input.responses);
  const due = followupDueAt(severity);
  const actions: string[] = [];

  // 1. 평가 저장
  const { data, error } = await supabase
    .from('crisis_assessments')
    .insert({
      user_id: userId,
      source: input.source,
      q1_passive_ideation: input.responses.q1,
      q2_active_ideation:  input.responses.q2,
      q3_method:           input.responses.q3,
      q4_intent:           input.responses.q4,
      q5_plan:             input.responses.q5,
      q6_recent_attempt:   input.responses.q6,
      severity,
      followup_due_at: due?.toISOString() ?? null,
      actions_triggered: [],
    })
    .select('id')
    .single();

  if (error) throw error;

  // 2. severity별 처치
  if (severity === 'urgent' || severity === 'high') {
    const { error: lockErr } = await supabase
      .from('safety_lockouts')
      .upsert({
        user_id: userId,
        reason: 'crisis_assessment',
        graduation_locked: true,
        decision_locked: true,
        locked_at: new Date().toISOString(),
        expires_at: null,        // 무기한 — 사용자 명시 해제 또는 followup 완료 후만
        released_at: null,
        released_by: null,
      });

    if (lockErr) {
      // 잠금 생성 실패는 안전 인프라의 핵심 결함 — silent 처리 금지.
      // 평가는 INSERT됐지만 잠금 안 됨 → actions에 실패 명시 + 사용자에게 throw로 알림.
      actions.push('lockout_failed');
      await supabase
        .from('crisis_assessments')
        .update({ actions_triggered: actions })
        .eq('id', data.id);
      console.error('[safety] CRITICAL: lockout creation failed', lockErr);
      throw new Error('잠금 생성에 실패했어. 1393에 직접 전화해줘.');
    }

    actions.push('lockout_created', 'hotline_shown');
    // followup_due_at 컬럼은 기록되지만 *Cron Edge Function은 미배포* (Phase D 작업).
    // 실제 푸시 발송 전까지는 actions에 followup_scheduled 기록하지 않음 — 사용자 기만 차단.
    // TODO B-1-followup: supabase/functions/safety-followup-cron/ 배포 후 본 분기에서 actions.push('followup_scheduled')
  } else if (severity === 'caution') {
    actions.push('hotline_shown');
  }

  // 3. actions 갱신 (성공 케이스)
  if (actions.length > 0) {
    await supabase
      .from('crisis_assessments')
      .update({ actions_triggered: actions })
      .eq('id', data.id);
  }

  return { id: data.id, severity, actions };
}

/**
 * 현재 사용자의 잠금 상태 조회.
 * 잠금 없음(row 없음 또는 released_at != null) 시 두 항목 모두 false.
 */
export async function isAppLocked(userId: string): Promise<AppLockState> {
  const { data, error } = await supabase
    .from('safety_lockouts')
    .select('graduation_locked, decision_locked, reason, locked_at, released_at, expires_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[safety] isAppLocked failed:', error.message);
    return { graduationLocked: false, decisionLocked: false };
  }
  if (!data) return { graduationLocked: false, decisionLocked: false };

  // 해제됨
  if (data.released_at) return { graduationLocked: false, decisionLocked: false };
  // 만료됨
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { graduationLocked: false, decisionLocked: false };
  }

  return {
    graduationLocked: !!data.graduation_locked,
    decisionLocked:   !!data.decision_locked,
    reason: data.reason,
    lockedAt: data.locked_at,
  };
}

/**
 * 사용자 명시 해제 또는 followup 완료 후 잠금 해제.
 * 본 함수는 *해제 흐름 화면* (app/safety/release.tsx)에서만 호출되어야 한다.
 * 모달 닫기 등 충동적 해제 차단을 위해 별도 화면 가드 필요.
 */
export async function acknowledgeLockout(
  userId: string,
  by: 'user_acknowledgment' | 'followup_resolution',
): Promise<void> {
  const { error } = await supabase
    .from('safety_lockouts')
    .update({
      released_at: new Date().toISOString(),
      released_by: by,
    })
    .eq('user_id', userId);
  if (error) throw error;

  // followup 완료 기록 (가장 최근 미완료 평가) — Supabase update는 order/limit 미지원이므로
  // SELECT로 id 조회 후 별도 UPDATE.
  if (by === 'followup_resolution') {
    const { data: latest } = await supabase
      .from('crisis_assessments')
      .select('id')
      .eq('user_id', userId)
      .is('followup_completed_at', null)
      .order('assessed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.id) {
      await supabase
        .from('crisis_assessments')
        .update({ followup_completed_at: new Date().toISOString() })
        .eq('id', latest.id);
    }
  }
}
