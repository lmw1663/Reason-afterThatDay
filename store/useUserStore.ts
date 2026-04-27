import { create } from 'zustand';
import { calcDaysElapsed, parseDateStr } from '@/utils/dateUtils';

interface UserState {
  userId: string | null;
  breakupDate: Date | null;
  daysElapsed: number;
  onboardingCompleted: boolean;
  pushToken: string | null;

  setUserId: (id: string) => void;
  setBreakupDate: (date: Date) => void;
  setOnboardingCompleted: (v: boolean) => void;
  setPushToken: (token: string) => void;
  refreshDaysElapsed: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  breakupDate: null,
  daysElapsed: 0,
  onboardingCompleted: false,
  pushToken: null,

  setUserId: (id) => set({ userId: id }),

  setBreakupDate: (date) => {
    set({ breakupDate: date, daysElapsed: calcDaysElapsed(date) });
  },

  setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

  setPushToken: (token) => set({ pushToken: token }),

  refreshDaysElapsed: () => {
    const { breakupDate } = get();
    if (breakupDate) {
      set({ daysElapsed: calcDaysElapsed(breakupDate) });
    }
  },

  reset: () =>
    set({
      userId: null,
      breakupDate: null,
      daysElapsed: 0,
      onboardingCompleted: false,
      pushToken: null,
    }),
}));
