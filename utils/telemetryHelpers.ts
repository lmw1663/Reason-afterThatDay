import type { PersonaCode } from './personaClassifier';
import { getPersonaTypology, type PersonaTypology } from '@/constants/personaTypology';

// X-4-2 텔레메트리 보조 — 민감 정보 차단 가드.
// telemetry events.payload에 P01~P20 코드 직접 포함 금지 (CLAUDE.md 페르소나 라벨 비노출).
// 4유형 카테고리(A/B/C/D)로 익명화 후 payload에 포함.

/**
 * 페르소나 코드를 4유형 카테고리로 익명화. 분류 미정·P12 baseline은 'baseline' 반환.
 *
 * 사용 예:
 *   trackEvent('persona_branch_applied', {
 *     screen: 'journal',
 *     branch: 'mini_first',
 *     persona_category: anonymizePersona(effectivePersona),
 *   });
 */
export function anonymizePersona(p: PersonaCode | null): PersonaTypology | 'baseline' {
  if (!p || p === 'P12') return 'baseline';
  return getPersonaTypology(p) ?? 'baseline';
}
