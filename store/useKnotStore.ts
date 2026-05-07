/**
 * useKnotStore — F-3
 *
 * 매듭 트랙 UI 상태:
 *   - knotTabVisible: 하단 탭 제일 오른쪽 *매듭* 탭 노출 여부 (스펙 §4-1 동적 탭)
 *   - lastPromptAt:   마지막 권유 모달 발화 시각 (ISO)
 *   - lastPromptDeclinedAt: 마지막 거절 시각 (7일 쿨다운 기준)
 *   - lastTriggerCycle: 마지막 트리거 발화의 cycle_index (같은 사이클 중복 발화 차단)
 *
 * Persistence: AsyncStorage — 앱 재시작 후에도 거절 의사·쿨다운 보존 (사용자 의도 존중).
 * 기존 store들이 vanilla zustand인 것과 패턴 분리. 본 store만 persist 도입한 이유:
 *   - "다시 묻지 말아줘" 의도는 *기기 재시작에 무관하게* 보존돼야 안전
 *   - 서버 회신 안 기다리고 *로컬에서 즉시* 트리거 차단 가능
 *
 * 시간·cycle 비교 순수 로직은 utils/knotCooldown.ts에 분리.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isInKnotCooldown, isPromptedThisCycle } from '@/utils/knotCooldown';

interface KnotState {
  knotTabVisible: boolean;
  lastPromptAt: string | null;
  lastPromptDeclinedAt: string | null;
  lastTriggerCycle: number | null;

  showKnotTab: () => void;
  hideKnotTab: () => void;

  recordPrompt: (cycleIndex: number) => void;
  recordDecline: () => void;
  recordAccept: (cycleIndex: number) => void;

  /** 현재 cycle에서 권유를 발화해도 되는지 (쿨다운·중복 검사). */
  canPromptNow: (currentCycleIndex: number, now?: Date) => boolean;

  reset: () => void;
}

const INITIAL_STATE = {
  knotTabVisible: false,
  lastPromptAt: null,
  lastPromptDeclinedAt: null,
  lastTriggerCycle: null,
} satisfies Omit<
  KnotState,
  | 'showKnotTab'
  | 'hideKnotTab'
  | 'recordPrompt'
  | 'recordDecline'
  | 'recordAccept'
  | 'canPromptNow'
  | 'reset'
>;

export const useKnotStore = create<KnotState>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      showKnotTab: () => set({ knotTabVisible: true }),
      hideKnotTab: () => set({ knotTabVisible: false }),

      /**
       * 권유 모달 *표시* 시점에 호출. lastTriggerCycle을 기록해 같은 사이클에서 재발화 차단.
       * F-5 권유 모달 컴포넌트의 mount 직후 1회 호출이 호출자 계약.
       * 그 다음 사용자 응답에 따라 recordDecline() 또는 recordAccept(cycleIndex) 호출.
       */
      recordPrompt: (cycleIndex) =>
        set({
          lastPromptAt: new Date().toISOString(),
          lastTriggerCycle: cycleIndex,
        }),

      /**
       * "지금은 아니야" 거절 시 호출. 7일 쿨다운 시작.
       * recordPrompt 호출 *후*에 호출돼야 lastTriggerCycle도 함께 기록된 상태로 보존됨.
       */
      recordDecline: () =>
        set({
          lastPromptDeclinedAt: new Date().toISOString(),
        }),

      /**
       * "응, 매듭을 지을래" 승낙 시 호출. 매듭 탭 노출 + 트리거 메타 갱신.
       * recordPrompt 호출 없이 *단독 호출 가능* — 모달 노출과 동시에 즉시 승낙 시나리오 대응.
       * lastPromptAt·lastTriggerCycle을 다시 set해도 무해 (idempotent).
       */
      recordAccept: (cycleIndex) =>
        set({
          lastPromptAt: new Date().toISOString(),
          lastTriggerCycle: cycleIndex,
          knotTabVisible: true,
        }),

      canPromptNow: (currentCycleIndex, now = new Date()) => {
        const { lastPromptDeclinedAt, lastTriggerCycle } = get();
        if (isInKnotCooldown(lastPromptDeclinedAt, now)) return false;
        if (isPromptedThisCycle(lastTriggerCycle, currentCycleIndex)) return false;
        return true;
      },

      reset: () => set({ ...INITIAL_STATE }),
    }),
    {
      name: 'knot-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        knotTabVisible: state.knotTabVisible,
        lastPromptAt: state.lastPromptAt,
        lastPromptDeclinedAt: state.lastPromptDeclinedAt,
        lastTriggerCycle: state.lastTriggerCycle,
      }),
    },
  ),
);
