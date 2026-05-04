// D-3 측정 시점 자동 트리거 (구현계획 §3-3-A) — *순수 함수*.
//
// 정책:
//  · D+7 ± 1일 → PHQ-9 권유 (마지막 응답이 onboarding/D+0 시점이면 노출)
//  · D+14 ± 1일 → GAD-7 권유 (동일)
//  · D+30 ± 2일 → RSE 권유 (동일)
//  · 권유 카드는 *닫기 가능* — 호출처에서 dismissed 상태 별도 보관
//  · 졸업 보류 중에는 트리거 무관 (홈 카드는 그대로 노출, 단 결정 유도 X)
//
// 본 함수는 *어떤* 검사를 권유할지만 결정. UI/저장은 호출처 책임.

import type { Instrument } from './scoring';

export interface AssessmentRecommendation {
  instrument: Instrument;
  source: 'd7' | 'd14' | 'd30';
  cardTitle: string;
  cardSubtitle: string;
}

const WINDOWS: Array<{
  instrument: Instrument;
  source: 'd7' | 'd14' | 'd30';
  centerDay: number;
  toleranceDays: number;
  cardTitle: string;
  cardSubtitle: string;
}> = [
  {
    instrument: 'PHQ9',
    source: 'd7',
    centerDay: 7,
    toleranceDays: 1,
    cardTitle: '오늘 마음 점검 같이 해볼래?',
    cardSubtitle: '9문항, 2분이면 끝나는 결 보기',
  },
  {
    instrument: 'GAD7',
    source: 'd14',
    centerDay: 14,
    toleranceDays: 1,
    cardTitle: '요즘 마음의 결 한 번 더 봐볼래?',
    cardSubtitle: '7문항, 1~2분이면 충분해',
  },
  {
    instrument: 'RSE',
    source: 'd30',
    centerDay: 30,
    toleranceDays: 2,
    cardTitle: '나에 대한 빛, 지금은 어때?',
    cardSubtitle: '10문항, 2분이면 결을 잡을 수 있어',
  },
];

/**
 * 오늘 권유할 검사 1건 결정. 다중 윈도우가 동시에 만족하면 더 좁은 윈도우 우선.
 * lastAssessmentByInstrument는 instrument → ISO 응답 시각 (또는 null).
 *
 * 권유 조건:
 *  · daysElapsed가 윈도우 안 (centerDay ± tolerance)
 *  · 해당 instrument의 마지막 응답이 *없거나* breakupISO 직후 7일 이내 (= D+0 onboarding)
 *    → 즉 *이 윈도우 권유 시점에 새로 측정한 적 없음*
 *  · 우선순위: 윈도우 도달이 빠른 instrument부터 (PHQ9 > GAD7 > RSE)
 */
export function pickRecommendation(
  daysElapsed: number,
  breakupISO: string | null,
  lastAssessmentByInstrument: Partial<Record<Instrument, string | null>>,
): AssessmentRecommendation | null {
  if (!breakupISO) return null;
  const breakupTime = Date.parse(breakupISO);
  if (Number.isNaN(breakupTime)) return null;

  for (const w of WINDOWS) {
    const inWindow =
      daysElapsed >= w.centerDay - w.toleranceDays &&
      daysElapsed <= w.centerDay + w.toleranceDays;
    if (!inWindow) continue;

    const last = lastAssessmentByInstrument[w.instrument];
    // 마지막 응답이 없거나, 마지막 응답이 *현재 권유 윈도우보다 한참 전*이면 권유
    if (!last) {
      return {
        instrument: w.instrument,
        source: w.source,
        cardTitle: w.cardTitle,
        cardSubtitle: w.cardSubtitle,
      };
    }
    // 마지막 응답 시각이 breakupTime + (centerDay - tolerance) 일 미만 → 권유 (D+0 응답으로 간주)
    const cutoffMs = breakupTime + (w.centerDay - w.toleranceDays) * 24 * 3600 * 1000;
    if (Date.parse(last) < cutoffMs) {
      return {
        instrument: w.instrument,
        source: w.source,
        cardTitle: w.cardTitle,
        cardSubtitle: w.cardSubtitle,
      };
    }
  }
  return null;
}
