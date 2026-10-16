import type { QuestionContext } from '@/store/useQuestionStore';
import type { IconName } from '@/components/ui/Icon';
import { colors } from './colors';

/**
 * 질문통 카드의 context별 시각 테마.
 *
 * 정책 — 사용자 노출 라벨은 *친화 어휘*만 허용:
 *  - graduation 라벨은 "매듭" — "졸업" 어휘는 lint:persona가 차단
 *  - analysis 라벨은 "돌아보기" — "분석"은 가치판단 톤이라 부드럽게 우회
 *  - context 코드(journal/compass/graduation/analysis)는 사용자 노출 X
 */
export interface ContextTheme {
  label: string;
  icon: IconName;
  accentColor: string;
  bgOverlay: string;
}

// 색은 *단일 브랜드 보라* 하나로 통일 (PATTERNS.md "컬러 절제 — 1 액센트", 최신
// 다크모드 앱들의 모노톤+단일 액센트 관례). context 구분은 색이 아니라 distinct한
// 아이콘(pen/compass/link/search)·라벨이 담당 — 4색 샐러드의 촌스러움 제거.
const ACCENT = colors.purple[400];
const ACCENT_BG = colors.overlayPurpleSoft;

export const CONTEXT_THEME: Record<QuestionContext, ContextTheme> = {
  journal:    { label: '이별 일기', icon: 'pen',     accentColor: ACCENT, bgOverlay: ACCENT_BG },
  compass:    { label: '나침반',   icon: 'compass', accentColor: ACCENT, bgOverlay: ACCENT_BG },
  graduation: { label: '매듭',     icon: 'link',    accentColor: ACCENT, bgOverlay: ACCENT_BG },
  analysis:   { label: '돌아보기', icon: 'search',  accentColor: ACCENT, bgOverlay: ACCENT_BG },
};

/**
 * 다중 context 질문은 의도 강도가 높은 순으로 primary 결정.
 *  graduation > compass > analysis > journal
 */
export function pickPrimaryContext(contexts: QuestionContext[]): QuestionContext {
  const order: QuestionContext[] = ['graduation', 'compass', 'analysis', 'journal'];
  for (const c of order) {
    if (contexts.includes(c)) return c;
  }
  return contexts[0] ?? 'journal';
}

export function getContextTheme(contexts: QuestionContext[]): ContextTheme {
  return CONTEXT_THEME[pickPrimaryContext(contexts)];
}
