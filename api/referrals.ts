import { supabase } from './supabase';
import {
  evaluateActiveThresholds,
  type ActiveThreshold,
  type UserSafetySnapshot,
} from '@/utils/referralEvaluator';
import type { CrisisSeverity } from './safety';
import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 외부 의뢰 임계 발동 평가 — X-3-잔여 단계 2 (DB wrapper)
 *
 * referralEvaluator는 *순수 함수*라 DB 무관 — 본 모듈이 사용자 데이터 snapshot을 채워
 * 평가 함수에 전달. 윈도우(14일/30일)는 본 모듈이 SQL `gte` 필터로 적용해 evaluator의
 * snapshot 명세를 충족.
 *
 * 호출처: EmotionalCheckModal(단계 3) · me.tsx 진입 시 위기 카드 노출 · cron job 등.
 */

const WINDOW_CRISIS_DAYS = 14; // cssrs_q1_q3_repeat 윈도우
const WINDOW_DECISION_DAYS = 30; // p19_decision_flip_repeat 윈도우

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * 사용자 안전 snapshot 빌드 — DB에서 14일/30일 윈도우 데이터 조회.
 * 한 쿼리 실패해도 빈 배열로 채워 evaluator가 작동(보수적 fail-open).
 */
export async function buildSafetySnapshot(userId: string): Promise<UserSafetySnapshot> {
  const sinceCrisis = isoDaysAgo(WINDOW_CRISIS_DAYS);
  const sinceDecision = isoDaysAgo(WINDOW_DECISION_DAYS);

  // 1. crisis_assessments 14일 — severity만 추출
  const { data: crisisRows } = await supabase
    .from('crisis_assessments')
    .select('severity')
    .eq('user_id', userId)
    .gte('created_at', sinceCrisis);

  const recentCrisisSeverities = (crisisRows ?? [])
    .map((r: { severity: string }) => r.severity as CrisisSeverity)
    .filter((s): s is CrisisSeverity => s === 'safe' || s === 'caution' || s === 'high' || s === 'urgent');

  // 2. decision_history 30일 — count만
  const { count: flipCountRaw } = await supabase
    .from('decision_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', sinceDecision);

  const recentDecisionFlipCount = flipCountRaw ?? 0;

  // 3. 현재 활성 페르소나 분류 (가장 최근 active=true 1건)
  const { data: personaRow } = await supabase
    .from('personas')
    .select('primary_persona, secondary_persona')
    .eq('user_id', userId)
    .eq('active', true)
    .order('estimated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const classifiedPersonas: PersonaCode[] = [];
  if (personaRow?.primary_persona) {
    classifiedPersonas.push(personaRow.primary_persona as PersonaCode);
  }
  if (personaRow?.secondary_persona) {
    classifiedPersonas.push(personaRow.secondary_persona as PersonaCode);
  }

  return {
    recentCrisisSeverities,
    recentDecisionFlipCount,
    classifiedPersonas,
  };
}

/**
 * 사용자에게 *현재* 발동된 외부 의뢰 임계 + 자원 목록 반환.
 * UI에서 위기 모달·자원 카드 노출에 사용 (단계 3).
 */
export async function getActiveReferrals(userId: string): Promise<ActiveThreshold[]> {
  const snapshot = await buildSafetySnapshot(userId);
  return evaluateActiveThresholds(snapshot);
}
