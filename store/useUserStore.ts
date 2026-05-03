import { create } from 'zustand';
import { calcDaysElapsed } from '@/utils/dateUtils';
import type { DurationRange } from '@/constants/duration';
import { supabase } from '@/api/supabase';
import type { ConsentVersionMap } from '@/api/consent';
import { isConsentValid } from '@/constants/consent';

interface UserState {
  userId: string | null;
  breakupDate: Date | null;
  daysElapsed: number;
  onboardingCompleted: boolean;
  pushToken: string | null;
  relationshipDuration: DurationRange | null;
  consentVersions: ConsentVersionMap | null;
  consentAcceptedAt: Date | null;

  setUserId: (id: string) => void;
  setBreakupDate: (date: Date) => void;
  setOnboardingCompleted: (v: boolean) => void;
  setPushToken: (token: string) => void;
  setRelationshipDuration: (d: DurationRange) => Promise<void>;
  setConsent: (versions: ConsentVersionMap, acceptedAt: Date) => void;
  hasValidConsent: () => boolean;
  refreshDaysElapsed: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  userId: null,
  breakupDate: null,
  daysElapsed: 0,
  onboardingCompleted: false,
  pushToken: null,
  relationshipDuration: null,
  consentVersions: null,
  consentAcceptedAt: null,

  setUserId: (id) => set({ userId: id }),

  setBreakupDate: (date) => {
    set({ breakupDate: date, daysElapsed: calcDaysElapsed(date) });
  },

  setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),

  setPushToken: (token) => set({ pushToken: token }),

  setRelationshipDuration: async (d) => {
    set({ relationshipDuration: d });
    const { userId } = get();
    if (userId) {
      await supabase
        .from('users')
        .update({ relationship_duration_range: d })
        .eq('id', userId);
    }
  },

  setConsent: (versions, acceptedAt) =>
    set({ consentVersions: versions, consentAcceptedAt: acceptedAt }),

  hasValidConsent: () => isConsentValid(get().consentVersions ?? null),

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
      relationshipDuration: null,
      consentVersions: null,
      consentAcceptedAt: null,
    }),
}));
