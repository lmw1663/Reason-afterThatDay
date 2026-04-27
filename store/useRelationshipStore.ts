import { create } from 'zustand';

export interface RelationshipProfile {
  reasons: string[];
  pros: string[];
  cons: string[];
  fix: number;    // 0~10
  other: number;  // 0~10
  role: number;   // 0~10
}

interface RelationshipState {
  profile: RelationshipProfile;
  setProfile: (profile: RelationshipProfile) => void;
  updateField: <K extends keyof RelationshipProfile>(key: K, value: RelationshipProfile[K]) => void;
}

const defaultProfile: RelationshipProfile = {
  reasons: [],
  pros: [],
  cons: [],
  fix: 0,
  other: 0,
  role: 0,
};

export const useRelationshipStore = create<RelationshipState>((set) => ({
  profile: defaultProfile,

  setProfile: (profile) => set({ profile }),

  updateField: (key, value) =>
    set((state) => ({ profile: { ...state.profile, [key]: value } })),
}));
