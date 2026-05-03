import type { PersonaCode } from '@/utils/personaClassifier';

/**
 * 페르소나 분기 predicate 모음 — C-2-G-3a~
 *
 * 사용자 노출 화면 코드(app/, components/)에서 *페르소나 코드 string*을 직접 박지 않도록
 * 본 헬퍼만 import해서 분기. lint:persona가 화면 코드의 'P01' 등 노출을 차단하므로
 * 모든 분기 룰은 utils/constants에 데이터로 두고 화면은 함수 호출만.
 *
 * 매트릭스 §2 셀별로 분기 함수 추가. 신규 화면 분기 시 본 파일을 먼저 갱신.
 */

// ───────── 일기 분기 (C-2-G-3a) ─────────

/** 미니 모드를 *primary 시각*으로 강조할 페르소나 (매트릭스 §2 C3 P02) */
const MINI_FIRST_PERSONAS: PersonaCode[] = ['P02'];

export function isMiniJournalFirst(p: PersonaCode | null): boolean {
  return p !== null && MINI_FIRST_PERSONAS.includes(p);
}

/** 거칠게 모드(raw-mode) 진입 가능 페르소나 (매트릭스 §2 C3 P10) — 본 화면은 D-5 구현 */
const RAW_MODE_PERSONAS: PersonaCode[] = ['P10'];

export function isRawModeAllowed(p: PersonaCode | null): boolean {
  return p !== null && RAW_MODE_PERSONAS.includes(p);
}

/** 감정 라벨에 "공허/멍함/시들음" 우선 노출 (매트릭스 §2 C3 P08) */
const EMPTINESS_LABELS_PRIORITY: PersonaCode[] = ['P08'];

export function isEmptinessLabelsPriority(p: PersonaCode | null): boolean {
  return p !== null && EMPTINESS_LABELS_PRIORITY.includes(p);
}
