// D-1 점수 산출 (구현계획 §3-1-C).
//
// PHQ-9·GAD-7·RSE 표준 채점 + 메타포 매핑.
// raw_score / band은 *내부 데이터*. UI 노출 시 항상 메타포 함수만 사용.
// "PHQ-9 18점, 중등도 우울" 같은 진단성 표현 금지 — 검증 §2-7 + 심리검사-도입가능성.md §3-4.
//
// 라이선스: docs/legal/scales-license.md
//  - PHQ-9 / GAD-7: Pfizer 공식 퍼블릭 허가 + Kroenke 외 (한국어판 안제용 외 2013)
//  - RSE: UMD 사회학과 공식 public domain (한국어 번역 전병제 1974)
//  - 모든 척도 인용은 app/legal/scales-attribution.tsx에서 사용자에게 표기

export type Instrument = 'PHQ2' | 'PHQ9' | 'GAD2' | 'GAD7' | 'RSE' | 'RRS10' | 'ECRR12' | 'PG13' | 'CSSRS';
export type Source = 'onboarding' | 'd7' | 'd14' | 'd30' | 'graduation' | 'manual';

export type Phq9Band = 'minimal' | 'mild' | 'moderate' | 'modSevere' | 'severe';
export type Gad7Band = 'minimal' | 'mild' | 'moderate' | 'severe';
export type RseBand = 'low' | 'avg' | 'high';

export interface Score<B extends string> {
  rawScore: number;
  band: B;
}

/**
 * PHQ-9 — 9문항 × 4점 리커트(0~3). 합 0~27.
 * Kroenke et al. (2001), 한국어판 안제용 외 (2013).
 *
 * Band:
 *  · 0~4   minimal     | 거의 없음
 *  · 5~9   mild        | 가벼움
 *  · 10~14 moderate    | 중간
 *  · 15~19 modSevere   | 중간-강함
 *  · 20~27 severe      | 강함
 */
export function scorePHQ9(responses: Record<string, number>): Score<Phq9Band> {
  const rawScore = sumNine(responses);
  let band: Phq9Band;
  if (rawScore <= 4) band = 'minimal';
  else if (rawScore <= 9) band = 'mild';
  else if (rawScore <= 14) band = 'moderate';
  else if (rawScore <= 19) band = 'modSevere';
  else band = 'severe';
  return { rawScore, band };
}

/**
 * GAD-7 — 7문항 × 4점 리커트(0~3). 합 0~21.
 * Spitzer et al. (2006), 한국어판 Seo & Park (2015).
 *
 * Band:
 *  · 0~4   minimal | 거의 없음
 *  · 5~9   mild    | 가벼움
 *  · 10~14 moderate| 중간
 *  · 15~21 severe  | 강함
 */
export function scoreGAD7(responses: Record<string, number>): Score<Gad7Band> {
  const rawScore = sumN(responses, 7);
  let band: Gad7Band;
  if (rawScore <= 4) band = 'minimal';
  else if (rawScore <= 9) band = 'mild';
  else if (rawScore <= 14) band = 'moderate';
  else band = 'severe';
  return { rawScore, band };
}

/**
 * RSE — 10문항 × 4점 리커트(0~3, 역코딩 포함). 합 0~30.
 * Rosenberg (1965), 한국어판 전병제 (1974).
 *
 * 역코딩 문항: 3·5·8·9·10 (영문 원본 기준 negative-worded). 응답값은 채점 전에 reverseRSE
 * 헬퍼로 변환 필요. 본 함수는 *이미 역코딩이 적용된* responses를 받는다.
 *
 * Band:
 *  · 0~14  low | 낮음
 *  · 15~25 avg | 평균
 *  · 26~30 high | 높음
 */
export function scoreRSE(responses: Record<string, number>): Score<RseBand> {
  const rawScore = sumN(responses, 10);
  let band: RseBand;
  if (rawScore <= 14) band = 'low';
  else if (rawScore <= 25) band = 'avg';
  else band = 'high';
  return { rawScore, band };
}

/**
 * RSE 역코딩 — UI에서 사용자가 본 동의 강도(0~3)를
 * 채점용 점수(0~3 또는 3~0)로 변환. 부정형 문항(3·5·8·9·10) 역코딩.
 */
const RSE_REVERSE_ITEMS = new Set([3, 5, 8, 9, 10]);
export function reverseRSE(itemNumber: number, response: number): number {
  if (RSE_REVERSE_ITEMS.has(itemNumber)) return 3 - response;
  return response;
}

// ───────── 메타포 매핑 (UI 노출 안전 게이트) ─────────

/**
 * Band → 사용자에게 보여줄 메타포 텍스트.
 * 절대 점수·진단명을 노출하지 않음. 검증 §2-7 + CLAUDE.md "정답이 아니야" 정신.
 */
export function bandMetaphor(instrument: Instrument, band: string): {
  headline: string;
  subline: string;
} {
  // PHQ-9 (우울)
  if (instrument === 'PHQ9') {
    switch (band as Phq9Band) {
      case 'minimal':   return { headline: '오늘 마음 날씨, 맑아',         subline: '큰 흐림 없이 잔잔한 결' };
      case 'mild':      return { headline: '엷은 안개가 깔린 날',          subline: '가벼운 무거움이 있어' };
      case 'moderate':  return { headline: '마음 날씨가 흐려',              subline: '쉬어가도 되는 날이야' };
      case 'modSevere': return { headline: '비가 한참 오는 중이야',         subline: '도움을 얻어도 좋은 날' };
      case 'severe':    return { headline: '폭풍 속이야 — 무리하지 마',     subline: '전문가의 도움이 필요한 시기' };
    }
  }
  // GAD-7 (불안)
  if (instrument === 'GAD7') {
    switch (band as Gad7Band) {
      case 'minimal':  return { headline: '바람 잔잔한 결',                 subline: '큰 동요 없는 마음' };
      case 'mild':     return { headline: '미세한 잔물결',                  subline: '약간 흔들려도 괜찮아' };
      case 'moderate': return { headline: '파도가 자주 일어',               subline: '쉬어가는 호흡이 필요한 때' };
      case 'severe':   return { headline: '거친 파도 속이야',               subline: '전문가의 도움이 필요한 시기' };
    }
  }
  // RSE (자존감)
  if (instrument === 'RSE') {
    switch (band as RseBand) {
      case 'low': return { headline: '나에 대한 빛이 약해진 시기',          subline: '당분간 친절한 말이 필요한 때' };
      case 'avg': return { headline: '나에 대한 빛, 평소만큼 켜져 있어',     subline: '평범하다는 것의 안정감' };
      case 'high': return { headline: '나에 대한 빛이 단단해',              subline: '큰 흔들림 없이 자기 자리에' };
    }
  }
  return { headline: '오늘 마음의 결을 봤어', subline: '결과는 정답이 아니야' };
}

// ───────── 내부 헬퍼 ─────────

function sumNine(responses: Record<string, number>): number {
  return sumN(responses, 9);
}

function sumN(responses: Record<string, number>, n: number): number {
  let s = 0;
  for (let i = 1; i <= n; i++) {
    const v = responses[`item${i}`];
    if (typeof v === 'number') s += v;
  }
  return s;
}
