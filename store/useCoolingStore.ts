import { create } from 'zustand';

export type CoolingStatus = 'cooling' | 'confirmed' | 'cancelled';

export interface CoolingState {
  id: string | null;
  status: CoolingStatus | null;
  requestedAt: string | null;
  coolingEndsAt: string | null;
  checkinResponses: unknown[];
  notificationsSent: number;

  setCooling: (data: Omit<CoolingState, 'setCooling' | 'updateStatus' | 'reset'>) => void;
  updateStatus: (status: CoolingStatus) => void;
  reset: () => void;
}

export const useCoolingStore = create<CoolingState>((set) => ({
  id: null,
  status: null,
  requestedAt: null,
  coolingEndsAt: null,
  checkinResponses: [],
  notificationsSent: 0,

  setCooling: (data) => set(data),

  updateStatus: (status) => set({ status }),

  reset: () =>
    set({
      id: null,
      status: null,
      requestedAt: null,
      coolingEndsAt: null,
      checkinResponses: [],
      notificationsSent: 0,
    }),
}));
