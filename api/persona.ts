import { supabase } from './supabase';
import {
  classifyPersona,
  type ClassifyInput,
  type PersonaResult,
  type PsychAxes,
  type PersonaCode,
} from '@/utils/personaClassifier';

/**
 * 페르소나 분류 API — C-1-3
 *
 * 인프라:
 *  - psych_profile_axes: 8축 측정값 시계열 (재분류마다 새 행)
 *  - personas: 분류 결과 이력 (active=true 행이 현재 분류)
 *
 * 본 모듈은 분류 *수행*까지만. 분기 적용은 Phase C-2 G-시리즈.
 */

export type ProfileSource = 'onboarding' | 'd7' | 'd14' | 'd30' | 'd60' | 'd90' | 'manual';

export interface ActivePersona {
  primary: PersonaCode;
  secondary: PersonaCode | null;
  estimatedAt: Date;
}

/**
 * 10축 값을 psych_profile_axes에 저장. a9/a10은 옵셔널(미옵트인 사용자는 NULL).
 */
export async function saveProfileAxes(
  userId: string,
  axes: PsychAxes,
  source: ProfileSource,
): Promise<void> {
  const { error } = await supabase
    .from('psych_profile_axes')
    .insert({
      user_id: userId,
      source,
      a1_attachment:       axes.a1_attachment,
      a2_initiator:        axes.a2_initiator,
      a3_breakup_mode:     axes.a3_breakup_mode,
      a4_duration:         axes.a4_duration,
      a5_health:           axes.a5_health,
      a6_complexity:       axes.a6_complexity,
      a7_dominant_emotion: axes.a7_dominant_emotion,
      a8_crisis:           axes.a8_crisis,
      a9_depression:       axes.a9_depression ?? null,
      a10_anxiety:         axes.a10_anxiety ?? null,
    });
  if (error) throw error;
}

/**
 * 분류 + 저장. 기존 active=true 행을 active=false로 갱신 후 새 행 insert.
 */
export async function classifyAndSavePersona(
  userId: string,
  input: ClassifyInput,
  source: ProfileSource,
): Promise<PersonaResult> {
  const result = classifyPersona(input);

  // crisis_lockout 모드는 페르소나 저장 안 함 (B-1 위기 흐름이 처리)
  if (result.mode === 'crisis_lockout') return result;

  // 8축 저장 (분류 결과와 별개로 시계열 보존)
  await saveProfileAxes(userId, input.axes, source);

  // 기존 active 행 비활성화
  await supabase
    .from('personas')
    .update({ active: false })
    .eq('user_id', userId)
    .eq('active', true);

  // 새 행 insert
  const { error: insertError } = await supabase
    .from('personas')
    .insert({
      user_id: userId,
      source,
      primary_persona: result.primary,
      primary_score: result.scores[result.primary],
      secondary_persona: result.secondary,
      secondary_score: result.secondary ? result.scores[result.secondary] : null,
      raw_scores: result.scores,
      axes_snapshot: input.axes,
      active: true,
    });
  if (insertError) throw insertError;

  return result;
}

/**
 * 가장 최근 10축 측정값 조회 — Phase H 단축형 양성 여부 게이트에 활용.
 * a9_depression·a10_anxiety는 NULL 가능 (옵트인 안 한 사용자). undefined로 정규화.
 */
export async function getLatestProfileAxes(userId: string): Promise<PsychAxes | null> {
  const { data, error } = await supabase
    .from('psych_profile_axes')
    .select('a1_attachment, a2_initiator, a3_breakup_mode, a4_duration, a5_health, a6_complexity, a7_dominant_emotion, a8_crisis, a9_depression, a10_anxiety')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn('[persona] getLatestProfileAxes failed:', error.message);
    return null;
  }
  if (!data) return null;
  return {
    a1_attachment:        data.a1_attachment        as 0 | 1 | 2 | 3,
    a2_initiator:         data.a2_initiator         as 0 | 1 | 2 | 3,
    a3_breakup_mode:      data.a3_breakup_mode      as 0 | 1 | 2 | 3,
    a4_duration:          data.a4_duration          as 0 | 1 | 2 | 3,
    a5_health:            data.a5_health            as 0 | 1 | 2 | 3,
    a6_complexity:        data.a6_complexity        as 0 | 1 | 2 | 3,
    a7_dominant_emotion:  data.a7_dominant_emotion  as 0 | 1 | 2 | 3 | 4,
    a8_crisis:            data.a8_crisis            as 0 | 1 | 2 | 3,
    a9_depression:  (data.a9_depression as number | null) === null ? undefined : data.a9_depression as 0 | 1 | 2 | 3,
    a10_anxiety:    (data.a10_anxiety   as number | null) === null ? undefined : data.a10_anxiety   as 0 | 1 | 2 | 3,
  };
}

/**
 * 현재 활성 페르소나 조회. 분류 안 된 사용자(신규/사별 응답자)는 null.
 */
export async function getActivePersona(userId: string): Promise<ActivePersona | null> {
  const { data, error } = await supabase
    .from('personas')
    .select('primary_persona, secondary_persona, estimated_at')
    .eq('user_id', userId)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    console.warn('[persona] getActivePersona failed:', error.message);
    return null;
  }
  if (!data) return null;

  return {
    primary: data.primary_persona as PersonaCode,
    secondary: (data.secondary_persona ?? null) as PersonaCode | null,
    estimatedAt: new Date(data.estimated_at),
  };
}

/**
 * D+N 재분류 — Phase C-1-4 cron에서 호출.
 * 현재 axes + 최근 일기·검사 결과를 입력으로 받아 재계산.
 */
export async function reclassifyPersona(
  userId: string,
  input: ClassifyInput,
  source: 'd7' | 'd14' | 'd30' | 'd60' | 'd90',
): Promise<PersonaResult> {
  return classifyAndSavePersona(userId, input, source);
}
