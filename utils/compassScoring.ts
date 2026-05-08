// Phase L-1 — 결정 나침반 점수 산식 redesign.
//
// 변경 전: check.tsx 안에 5개 boolean 응답 → 단순 합 + want 보너스 ±2 inline.
// 변경 후: 순수 함수로 추출 + v2 §4 "변화 추적" 의도 반영:
//   1. raw score        — 기존 5문항 boolean 합 (그대로)
//   2. stability bonus  — 최근 N일 방향 일관성에 따라 want 보너스 강도 조절
//                          stability >=0.8 → ±3, >=0.5 → ±2, <0.5 → ±1
//   3. confidence (1~10) — want(직감) ↔ score(이성) 일치도 + 강도
//                          decision_history.confidence 컬럼(v2 §3) 정합
//
// 의도적 보존:
//   - 5문항 catchScore/letGoScore 가중치 그대로 (임상 판정 알고리즘 무손상)
//   - 페르소나 modifier 미도입 — 임상 검증 필요한 영역 (SSOT §9-1 deferred)
//
// 임상 안전: confidence 가 *낮음 = 결정 미루라*는 단정으로 작동하지 않음.
// UI 단에서 "흔들리는 마음도 자연스러워" 톤으로 노출 — 점수 자체는 신호일 뿐.

import type { Direction } from '@/store/useJournalStore';

export interface CompassQuestion {
  id: string;
  catchScore: number;
  letGoScore: number;
}

export interface CompassScoreInput {
  /** 5개 boolean 응답 — 'yes'/'no' UI 키 */
  answers: Record<string, 'yes' | 'no'>;
  /** 5개 질문 가중치 매트릭스 */
  questions: ReadonlyArray<CompassQuestion>;
  /** 사용자 직감 방향 (want.tsx 에서 선택) */
  want: Direction;
  /** 최근 N일 일기 방향 (안정성 계산용). 비면 stability=0 → 보너스 약화 */
  recentDirections?: ReadonlyArray<Direction>;
}

export interface CompassScoreOutput {
  /** 최종 점수 = raw + stabilityBonus */
  score: number;
  /** 1~10 confidence — 직감과 점수 방향 일치 + 강도 */
  confidence: number;
  /** 5문항 boolean 합 (modifier 적용 전) */
  rawScore: number;
  /** want 방향 보너스 (stability 로 강도 조절). +catch/-let_go/0 */
  stabilityBonus: number;
  /** 0~1 — 최근 방향 일관성. 디버깅·UI 표시용 */
  stability: number;
}

/**
 * 최근 방향 배열에서 같은 방향이 차지하는 최대 비율 (0~1).
 *
 * 주의: undecided 도 카운트 — '결정 안 한 마음' 도 일관성 신호로 본다는 의도.
 * 'undecided 가 일관됐다 = 사용자가 아직 자기 마음을 모르고 있다' → bonus magnitude=3
 * 까지 가도 stabilityBonus 는 want=undecided 면 0 으로 떨어지므로 위험 없음.
 * want=catch/let_go 인데 history 가 모두 undecided 면 ±3 가 적용되긴 하나, 실제
 * 그런 사용자는 매우 드물고 (직감은 있는데 일기에선 매번 모르겠다 함) 임상적으로
 * 그 직감 신호를 어차피 신뢰하기 어려워 cap 효과만 있음.
 */
export function computeDirectionStability(recent: ReadonlyArray<Direction>): number {
  if (recent.length === 0) return 0;
  const counts: Record<Direction, number> = { catch: 0, let_go: 0, undecided: 0 };
  for (const d of recent) counts[d]++;
  const max = Math.max(counts.catch, counts.let_go, counts.undecided);
  return max / recent.length;
}

/** stability 에 따른 want 보너스 강도. 일관성 높을수록 직감 가중치 ↑. */
export function computeStabilityBonusMagnitude(stability: number): number {
  if (stability >= 0.8) return 3;
  if (stability >= 0.5) return 2;
  return 1;
}

/**
 * confidence 1~10
 * - want 와 score 방향 *일치* (둘 다 catch 쪽 또는 둘 다 let_go 쪽) → 5 + |score| (cap 10)
 * - 불일치 (직감 ↔ 이성 어긋남) → 5 - |score| (floor 1)
 * - want === 'undecided' → 직감이 없으므로 score 강도만 → cap 5 (확신 한계)
 */
export function computeConfidence(want: Direction, score: number): number {
  const intensity = Math.min(Math.abs(score), 10);
  if (want === 'undecided') {
    return Math.max(1, Math.min(5, Math.round(intensity / 2)));
  }
  const wantsCatch = want === 'catch';
  const scoreCatch = score > 0;
  const scoreLetGo = score < 0;
  const agree = (wantsCatch && scoreCatch) || (!wantsCatch && scoreLetGo);
  if (agree) return Math.min(10, 5 + Math.round(intensity / 2));
  if (score === 0) return 5; // 점수 중립이면 직감만 — 중간 확신
  return Math.max(1, 5 - Math.round(intensity / 2));
}

export function computeCompassScore(input: CompassScoreInput): CompassScoreOutput {
  // 1. raw score from 5 boolean questions (legacy formula)
  let rawScore = 0;
  for (const q of input.questions) {
    if (input.answers[q.id] === 'yes') rawScore += q.catchScore;
    else if (input.answers[q.id] === 'no') rawScore -= q.letGoScore;
  }

  // 2. direction stability bonus (NEW)
  const stability = computeDirectionStability(input.recentDirections ?? []);
  const magnitude = computeStabilityBonusMagnitude(stability);
  const stabilityBonus =
    input.want === 'catch' ? magnitude :
    input.want === 'let_go' ? -magnitude :
    0;

  const score = rawScore + stabilityBonus;
  const confidence = computeConfidence(input.want, score);

  return { score, confidence, rawScore, stabilityBonus, stability };
}
