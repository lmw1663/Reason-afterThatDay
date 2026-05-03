import hotlinesData from '@/resources/crisis-hotlines.json';
import type { PersonaCode } from '@/constants/personaCards';

/**
 * 핫라인 조회 헬퍼 — B-0-2
 *
 * crisis-hotlines.json은 신뢰의 단일 출처(SSOT). 본 헬퍼만 사용해 페르소나별 우선 핫라인을
 * 조회하고, 어떠한 화면에서도 핫라인 정보를 직접 하드코딩하지 않는다 (CLAUDE.md 절대 규칙).
 */

export interface Hotline {
  id: string;
  name: string;
  number: string | null;
  url?: string;
  available: string;
  operator: string;
  description: string;
  tags?: string[];
  persona_priority?: PersonaCode[];
  tone?: 'honorific' | 'casual';
  verified_at?: string;
}

interface HotlinesPayload {
  hotlines: Hotline[];
  _persona_mapping_summary: Record<PersonaCode | '_note', string[] | string>;
}

const data = hotlinesData as unknown as HotlinesPayload;

const HOTLINE_BY_ID: Record<string, Hotline> = data.hotlines.reduce(
  (acc, h) => ({ ...acc, [h.id]: h }),
  {} as Record<string, Hotline>,
);

/** 모든 핫라인 (resources 화면용). */
export function getAllHotlines(): Hotline[] {
  return data.hotlines;
}

/**
 * 페르소나별 우선 노출 핫라인 목록 (priority 순).
 * 매핑이 없으면 baseline `mental_health_crisis`만 반환.
 */
export function getHotlinesForPersona(persona: PersonaCode | null): Hotline[] {
  if (!persona) return defaultHotlines();
  const ids = data._persona_mapping_summary[persona];
  if (!Array.isArray(ids) || ids.length === 0) return defaultHotlines();
  return ids
    .map(id => HOTLINE_BY_ID[id])
    .filter((h): h is Hotline => h !== undefined);
}

/** 페르소나 미정/baseline 진입 시. */
function defaultHotlines(): Hotline[] {
  const fallback = HOTLINE_BY_ID['mental_health_crisis'];
  return fallback ? [fallback] : [];
}
