import { create } from 'zustand';
import type { PersonaCode } from '@/utils/personaClassifier';
import type { ActivePersona } from '@/api/persona';

/**
 * 페르소나 스토어 — C-1-3
 *
 * 사용처: 모든 화면 분기(C-2 G-시리즈), 위기 모달의 페르소나별 핫라인,
 *        GPT 시스템 프롬프트(X-2-B), 다중 페르소나 충돌 해소(C-3-H).
 *
 * 라벨 비노출 원칙: 본 스토어 값은 *내부 분기 결정*에만 사용.
 * 화면 텍스트·아이콘에 페르소나 코드/명을 직접 노출하면 lint(B-4)가 차단.
 */
interface PersonaState {
  primary: PersonaCode | null;
  secondary: PersonaCode | null;
  estimatedAt: Date | null;

  setPersona: (p: ActivePersona | null) => void;
  reset: () => void;
}

export const usePersonaStore = create<PersonaState>((set) => ({
  primary: null,
  secondary: null,
  estimatedAt: null,

  setPersona: (p) =>
    set(
      p
        ? { primary: p.primary, secondary: p.secondary, estimatedAt: p.estimatedAt }
        : { primary: null, secondary: null, estimatedAt: null },
    ),

  reset: () => set({ primary: null, secondary: null, estimatedAt: null }),
}));
