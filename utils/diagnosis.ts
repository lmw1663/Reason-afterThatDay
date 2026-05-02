import type { RelationshipProfile } from '@/store/useRelationshipStore';
import type { CompassVerdict } from '@/store/useDecisionStore';

export interface DiagnosisResult {
  reconnect: number; // 0~1
  fix: number;       // 0~1
  heal: number;      // 0~1
}

// 가망 진단 점수 산식 (가중치 기반)
export function calcDiagnosis(profile: RelationshipProfile, moodAvg: number): DiagnosisResult {
  const prosTotal = profile.pros.length;
  const consTotal = profile.cons.length;
  const prosRatio = prosTotal / (prosTotal + consTotal + 0.01);

  const reconnect = profile.fix * 0.5 + profile.other * 0.3 + profile.role * 0.2;
  const fix = profile.fix * 0.7 + prosRatio * 0.3;
  const heal = (Math.max(1, Math.min(10, moodAvg)) - 1) / 9;

  return {
    reconnect: Math.min(1, reconnect / 10),
    fix: Math.min(1, fix / 10),
    heal,
  };
}

// 나침반 판정 — diff = (잡아야 합산) - (보내야 합산), 범위 -10~+10
// 기존 5종 verdict (affection_level 없을 때 폴백)
export function compassVerdict(diff: number): CompassVerdict {
  if (diff >= 3)  return 'strong_catch';
  if (diff >= 1)  return 'lean_catch';
  if (diff > -1)  return 'undecided';
  if (diff > -3)  return 'lean_let_go';
  return 'strong_let_go';
}

// 7종 verdict (affection_level 수평축 포함) — 6-2
export function compassVerdictWithAffection(
  diff: number,
  affectionLevel: number | null,
): CompassVerdict {
  if (affectionLevel === null) return compassVerdict(diff);

  if (diff >= 3) {
    // 잡고 싶음
    if (affectionLevel <= 3) return 'DANGER_OBSESSION'; // 잡기 + 미움 → 집착 위험
    return 'strong_catch';
  }
  if (diff < -3) return 'strong_let_go';

  if (Math.abs(diff) <= 1) {
    // 모르겠음 — affection_level로 분화
    if (affectionLevel >= 7) return 'undecided_with_love';
    if (affectionLevel <= 3) return 'undecided_with_resentment';
    return 'undecided';
  }

  return diff > 0 ? 'lean_catch' : 'lean_let_go';
}

export const VERDICT_LABEL: Record<CompassVerdict, string> = {
  strong_catch:              '잡고 싶은 마음이 꽤 강해 보여',
  lean_catch:                '잡고 싶은 쪽으로 조금 기울어진 것 같아',
  undecided:                 '아직 어느 쪽도 확실하지 않아',
  undecided_with_love:       '좋아하는 마음이 남아있는 채로 모르겠는 것 같아',
  undecided_with_resentment: '미운 마음과 모르겠음이 뒤섞여 있는 것 같아',
  lean_let_go:               '보내고 싶은 쪽으로 조금 기울어진 것 같아',
  strong_let_go:             '보내고 싶은 마음이 꽤 강해 보여',
  DANGER_OBSESSION:          '잡고 싶은 마음과 미운 마음이 동시에 있는 것 같아',
};

export const VERDICT_COLOR: Record<CompassVerdict, string> = {
  strong_catch:              '#7F77DD',
  lean_catch:                '#B8B4EE',
  undecided:                 '#888780',
  undecided_with_love:       '#B8B4EE',
  undecided_with_resentment: '#E87C7C',
  lean_let_go:               '#3DB58A',
  strong_let_go:             '#1D9E75',
  DANGER_OBSESSION:          '#E87C7C',
};
