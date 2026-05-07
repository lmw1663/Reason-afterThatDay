import { create } from 'zustand';

export interface RelationshipProfile {
  reasons: string[];
  pros: string[];
  cons: string[];
  fix: number;    // 0~10
  other: number;  // 0~10
  role: number;   // 0~10
  prosByDate: Record<string, string[]>;  // { "D+5": [...] }
  consByDate: Record<string, string[]>;  // { "D+15": [...] }
  /** 매듭 사이클 누적 (마이그레이션 033). 1부터 시작. F-8 가역성 — 매듭 후 새 cycle 시작 시 증가. */
  cycleCount: number;
  /** 가장 최근 매듭 완료 시각 (ISO). null이면 아직 매듭 경험 없음. */
  lastKnotAt: string | null;
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
  prosByDate: {},
  consByDate: {},
  cycleCount: 1,
  lastKnotAt: null,
};

export const useRelationshipStore = create<RelationshipState>((set) => ({
  profile: defaultProfile,

  setProfile: (profile) => set({ profile }),

  updateField: (key, value) =>
    set((state) => ({ profile: { ...state.profile, [key]: value } })),
}));
