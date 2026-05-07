import { create } from 'zustand';

export type CoolingStatus = 'cooling' | 'confirmed' | 'cancelled';

export interface CoolingState {
  id: string | null;
  status: CoolingStatus | null;
  requestedAt: string | null;
  coolingEndsAt: string | null;
  checkinResponses: unknown[];
  notificationsSent: number;
  // F-12 P1-D: 매듭 신청 시점 페르소나 정책 스냅샷 보존
  // 페르소나 재추정에도 cooling 진행 중 화면은 *신청 시점* 라벨·일수 유지
  knotLabel: string | null;
  coolingPeriodDays: number | null;
  personaCodes: string[];
  cycleIndex: number | null;

  setCooling: (data: Omit<CoolingState, 'setCooling' | 'updateStatus' | 'reset'>) => void;
  updateStatus: (status: CoolingStatus) => void;
  reset: () => void;
}

const INITIAL_COOLING_STATE = {
  id: null,
  status: null,
  requestedAt: null,
  coolingEndsAt: null,
  checkinResponses: [],
  notificationsSent: 0,
  knotLabel: null,
  coolingPeriodDays: null,
  personaCodes: [],
  cycleIndex: null,
} satisfies Omit<CoolingState, 'setCooling' | 'updateStatus' | 'reset'>;

export const useCoolingStore = create<CoolingState>((set) => ({
  ...INITIAL_COOLING_STATE,

  setCooling: (data) => set(data),

  updateStatus: (status) => set({ status }),

  reset: () => set({ ...INITIAL_COOLING_STATE }),
}));
