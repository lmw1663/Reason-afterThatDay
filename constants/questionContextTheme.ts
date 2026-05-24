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

export const CONTEXT_THEME: Record<QuestionContext, ContextTheme> = {
  journal:    { label: '이별 일기', icon: 'pen',     accentColor: colors.purple[400], bgOverlay: colors.overlayPurpleSoft },
  compass:    { label: '나침반',   icon: 'compass', accentColor: colors.teal[400],   bgOverlay: colors.overlayTealSoft   },
  graduation: { label: '매듭',     icon: 'link',    accentColor: colors.coral[400],  bgOverlay: colors.overlayCoralSoft  },
  analysis:   { label: '돌아보기', icon: 'search',  accentColor: colors.amber[400],  bgOverlay: colors.overlayAmberSoft  },
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
