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
export function compassVerdict(diff: number): CompassVerdict {
  if (diff >= 3)  return 'strong_catch';
  if (diff >= 1)  return 'lean_catch';
  if (diff > -1)  return 'undecided';
  if (diff > -3)  return 'lean_let_go';
  return 'strong_let_go';
}

export const VERDICT_LABEL: Record<CompassVerdict, string> = {
  strong_catch:   '잡고 싶은 마음이 꽤 강해 보여',
  lean_catch:     '잡고 싶은 쪽으로 조금 기울어진 것 같아',
  undecided:      '아직 어느 쪽도 확실하지 않아',
  lean_let_go:    '보내고 싶은 쪽으로 조금 기울어진 것 같아',
  strong_let_go:  '보내고 싶은 마음이 꽤 강해 보여',
};

export const VERDICT_COLOR: Record<CompassVerdict, string> = {
  strong_catch:  '#7F77DD',
  lean_catch:    '#B8B4EE',
  undecided:     '#888780',
  lean_let_go:   '#3DB58A',
  strong_let_go: '#1D9E75',
};
