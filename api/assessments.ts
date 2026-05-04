import { supabase } from './supabase';
import {
  scorePHQ9,
  scoreGAD7,
  scoreRSE,
  type Instrument,
  type Source,
} from '@/utils/scoring';

// D-1 검사 응답 저장·조회 (구현계획 §3-1-B).
//
// 정책:
//  · 본인 데이터만 — RLS가 강제. 호출자는 자기 userId만 넘길 것
//  · raw_score / band은 *서버 저장*되지만 UI 노출은 메타포만 (utils/scoring.ts:bandMetaphor)
//  · CSSRS는 본 모듈 미지원 — 별도 api/safety.ts(crisis_assessments) 사용

export interface AssessmentRow {
  id: string;
  assessedAt: string;
  source: Source;
  instrument: Instrument;
  responses: Record<string, number>;
  rawScore: number | null;
  band: string | null;
}

/**
 * 단일 검사 응답 저장. responses는 { item1: 0~3, item2: ..., ... }.
 * 점수·band은 서버에서 자동 산출 (PHQ9/GAD7/RSE만). 다른 instrument는 raw로 저장하고 점수 null.
 */
export async function recordAssessment(
  userId: string,
  instrument: Instrument,
  responses: Record<string, number>,
  source: Source,
): Promise<{ rawScore: number | null; band: string | null }> {
  let rawScore: number | null = null;
  let band: string | null = null;

  if (instrument === 'PHQ9') {
    const r = scorePHQ9(responses);
    rawScore = r.rawScore;
    band = r.band;
  } else if (instrument === 'GAD7') {
    const r = scoreGAD7(responses);
    rawScore = r.rawScore;
    band = r.band;
  } else if (instrument === 'RSE') {
    const r = scoreRSE(responses);
    rawScore = r.rawScore;
    band = r.band;
  }

  const { error } = await supabase.from('psych_assessments').insert({
    user_id: userId,
    instrument,
    responses,
    raw_score: rawScore,
    band,
    source,
  });
  if (error) throw error;

  return { rawScore, band };
}

/** 단일 instrument의 시계열 응답. 메타포 매핑은 호출처가 적용. */
export interface TimePoint {
  assessedAt: string;
  rawScore: number;
  band: string;
}

export interface RecoveryTrace {
  phq9: TimePoint[];
  gad7: TimePoint[];
  rse: TimePoint[];
  d0Snapshot: { phq9: number | null; gad7: number | null; rse: number | null };
  currentSnapshot: { phq9: number | null; gad7: number | null; rse: number | null };
}

/**
 * 회복 추적용 시계열 + D+0/현재 스냅샷.
 * onboarding source가 D+0 (없으면 가장 오래된 행).
 * UI에서는 첫/마지막 비교 카드 + 메타포로 시각화.
 */
export async function getRecoveryTrace(userId: string): Promise<RecoveryTrace> {
  const { data, error } = await supabase
    .from('psych_assessments')
    .select('assessed_at, source, instrument, raw_score, band')
    .eq('user_id', userId)
    .in('instrument', ['PHQ9', 'GAD7', 'RSE'])
    .order('assessed_at', { ascending: true });
  if (error) throw error;

  const phq9: TimePoint[] = [];
  const gad7: TimePoint[] = [];
  const rse: TimePoint[] = [];

  for (const row of data ?? []) {
    if (row.raw_score === null || row.band === null) continue;
    const point: TimePoint = {
      assessedAt: row.assessed_at as string,
      rawScore: row.raw_score as number,
      band: row.band as string,
    };
    if (row.instrument === 'PHQ9') phq9.push(point);
    else if (row.instrument === 'GAD7') gad7.push(point);
    else if (row.instrument === 'RSE') rse.push(point);
  }

  return {
    phq9,
    gad7,
    rse,
    d0Snapshot: {
      phq9: phq9[0]?.rawScore ?? null,
      gad7: gad7[0]?.rawScore ?? null,
      rse: rse[0]?.rawScore ?? null,
    },
    currentSnapshot: {
      phq9: phq9[phq9.length - 1]?.rawScore ?? null,
      gad7: gad7[gad7.length - 1]?.rawScore ?? null,
      rse: rse[rse.length - 1]?.rawScore ?? null,
    },
  };
}

/** 단일 instrument의 마지막 응답 시점. 자동 트리거(D+7/14/30) 게이트 판단용. */
export async function getLastAssessmentDate(
  userId: string,
  instrument: Instrument,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('psych_assessments')
    .select('assessed_at')
    .eq('user_id', userId)
    .eq('instrument', instrument)
    .order('assessed_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return (data?.assessed_at as string | undefined) ?? null;
}
