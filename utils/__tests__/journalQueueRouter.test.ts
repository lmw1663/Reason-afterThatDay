import { describe, it, expect } from 'vitest';
import {
  buildQueueSequence,
  type BuildQueueArgs,
  type QueueItem,
} from '@/utils/journalQueueRouter';
import type { Question } from '@/store/useQuestionStore';

const SAMPLE_SMARTQ: Question = {
  id: 'j_today_mood',
  text: '오늘 하루 어떤 순간이 제일 기억에 남아?',
  context: ['journal'],
  isActive: true,
  weight: 5,
};

function makeArgs(overrides: Partial<BuildQueueArgs> = {}): BuildQueueArgs {
  return {
    persona: 'P12',
    guardOverlayPersona: null,
    daysElapsed: 10,
    decisionLocked: false,
    smartQ: SAMPLE_SMARTQ,
    recentlyServedAboutMe: [],
    recentlyServedMemory: [],
    prosConsAnsweredToday: { pros: false, cons: false },
    prioritySkippedIds: new Set(),
    seed: 10,
    ...overrides,
  };
}

function kinds(items: QueueItem[]): string[] {
  return items.map((i) => i.kind);
}

describe('buildQueueSequence — 일기 통합 큐 라우터', () => {
  describe('큐 길이 상한 (D+N별)', () => {
    it('D+0 → 최대 3개', () => {
      const items = buildQueueSequence(makeArgs({ daysElapsed: 0 }));
      expect(items.length).toBeLessThanOrEqual(3);
    });
    it('D+7 → 최대 3개 (boundary)', () => {
      const items = buildQueueSequence(makeArgs({ daysElapsed: 7 }));
      expect(items.length).toBeLessThanOrEqual(3);
    });
    it('D+8 → 최대 5개', () => {
      const items = buildQueueSequence(makeArgs({ daysElapsed: 8 }));
      expect(items.length).toBeLessThanOrEqual(5);
    });
    it('D+10 baseline (P12) → 4개 (smartQ + aboutMe + memory + prosCons)', () => {
      const items = buildQueueSequence(makeArgs({ daysElapsed: 10, persona: 'P12' }));
      expect(items.length).toBe(4);
    });
  });

  describe('SmartQ 첫 항목', () => {
    it('smartQ 있으면 첫 항목', () => {
      const items = buildQueueSequence(makeArgs());
      expect(items[0].kind).toBe('smartQ');
      expect(items[0].smartQ?.id).toBe('j_today_mood');
    });
    it('smartQ null이면 생략', () => {
      const items = buildQueueSequence(makeArgs({ smartQ: null }));
      expect(items.find((i) => i.kind === 'smartQ')).toBeUndefined();
    });
  });

  describe('About-me — 페르소나 정렬 + 반복 회피', () => {
    it('P02 → body 우선 (페르소나 정렬)', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P02' }));
      const aboutMe = items.find((i) => i.kind === 'aboutMe');
      expect(aboutMe?.aboutMe).toBe('body');
    });
    it('P09 → needs 우선', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P09' }));
      const aboutMe = items.find((i) => i.kind === 'aboutMe');
      expect(aboutMe?.aboutMe).toBe('needs');
    });
    it('최근 응답 회피 — self_love가 최근에 있으면 다른 카테고리', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        recentlyServedAboutMe: ['self_love'],
      }));
      const aboutMe = items.find((i) => i.kind === 'aboutMe');
      expect(aboutMe?.aboutMe).not.toBe('self_love');
    });
  });

  describe('Memory — 미화 차단 + 반복 회피', () => {
    it('P12 → painful 우선 (default 순서)', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P12' }));
      const memory = items.find((i) => i.kind === 'memory');
      expect(memory?.memory).toBe('painful');
    });
    it('P10 (미화 차단) → happy/miss 후보 제거', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P10',
        recentlyServedMemory: ['painful', 'growth'],
      }));
      const memory = items.find((i) => i.kind === 'memory');
      // painful·growth 둘 다 최근 답했고 happy/miss는 차단 → 첫 가용항목(painful) 폴백
      expect(['painful', 'growth']).toContain(memory?.memory);
    });
    it('P14 (HARMFUL — 미화 차단) → happy 차단', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P14',
        recentlyServedMemory: ['painful'],
      }));
      const memory = items.find((i) => i.kind === 'memory');
      expect(memory?.memory).toBe('growth');
    });
    it('guardOverlay에 차단 페르소나 있어도 적용', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P03',
        guardOverlayPersona: 'P10',  // P10이 미화 차단
        recentlyServedMemory: ['painful', 'growth'],
      }));
      const memory = items.find((i) => i.kind === 'memory');
      expect(['painful', 'growth']).toContain(memory?.memory);
    });
  });

  describe('ProsCons — 페르소나 차단', () => {
    it('P12 (정상) → prosCons 포함', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P12' }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeDefined();
    });
    it('P01 (HARMFUL) → prosCons 제외', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P01' }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
    });
    it('P19 (ROCD) → prosCons 제외', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P19' }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
    });
    it('guardOverlay에 차단 페르소나 → 제외', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P03',
        guardOverlayPersona: 'P14',
      }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
    });
  });

  describe('ProsCons — decisionLocked 정합', () => {
    it('decisionLocked=true → prosCons 제외', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        decisionLocked: true,
      }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
    });
  });

  describe('ProsCons — 비율 결정 + 중복 방지', () => {
    it('P10 D+10 (단점 0.7) → 단점 비중이 높음', () => {
      // D+8+ 큐 길이 5 → prosCons 항목 포함 보장
      let consCount = 0;
      for (let seed = 0; seed < 10; seed++) {
        const items = buildQueueSequence(makeArgs({
          persona: 'P10',
          daysElapsed: 10,
          seed,
        }));
        const prosCons = items.find((i) => i.kind === 'prosCons');
        if (prosCons?.prosCons === 'cons') consCount++;
      }
      expect(consCount).toBeGreaterThanOrEqual(6);
    });
    it('P17 D+10 (장점 보존 0.3) → 장점 비중이 높음', () => {
      let prosCount = 0;
      for (let seed = 0; seed < 10; seed++) {
        const items = buildQueueSequence(makeArgs({
          persona: 'P17',
          daysElapsed: 10,
          seed,
        }));
        const prosCons = items.find((i) => i.kind === 'prosCons');
        if (prosCons?.prosCons === 'pros') prosCount++;
      }
      expect(prosCount).toBeGreaterThanOrEqual(6);
    });
    it('이미 단점 답한 오늘 → 장점만 가능', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        prosConsAnsweredToday: { pros: false, cons: true },
      }));
      const prosCons = items.find((i) => i.kind === 'prosCons');
      expect(prosCons?.prosCons).toBe('pros');
    });
    it('이미 둘 다 답한 오늘 → prosCons 슬롯 자체 없음', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        prosConsAnsweredToday: { pros: true, cons: true },
      }));
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
    });
  });

  describe('Priority skipped — 어제 스킵 항목 앞으로', () => {
    it('스킵된 항목이 있으면 큐 앞으로', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        // smartQ가 어제 스킵됐으면 그대로 첫 항목 (이미 첫 항목이지만 안정성 검증)
        prioritySkippedIds: new Set(['memory:painful']),
      }));
      // memory가 다른 항목들 앞으로 정렬
      expect(items[0].kind).toBe('memory');
      expect(items[0].memory).toBe('painful');
    });
    it('스킵 항목 없으면 default 순서 유지', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P12' }));
      expect(kinds(items)).toEqual(['smartQ', 'aboutMe', 'memory', 'prosCons']);
    });
  });

  describe('통합 시나리오', () => {
    it('P12 D+10 baseline → smartQ + aboutMe + memory + prosCons 4개', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P12', daysElapsed: 10 }));
      expect(kinds(items)).toEqual(['smartQ', 'aboutMe', 'memory', 'prosCons']);
    });
    it('P01 D+10 (HARMFUL — prosCons 차단) → smartQ + aboutMe + memory 3개', () => {
      const items = buildQueueSequence(makeArgs({ persona: 'P01', daysElapsed: 10 }));
      expect(kinds(items)).toEqual(['smartQ', 'aboutMe', 'memory']);
    });
    it('P14 D+0 (HARMFUL + 길이 상한 3) → smartQ + aboutMe + memory 3개', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P14',
        daysElapsed: 0,
      }));
      expect(items.length).toBe(3);
      expect(items.find((i) => i.kind === 'prosCons')).toBeUndefined();
      // happy 미화 차단 → painful 우선
      expect(items.find((i) => i.kind === 'memory')?.memory).toBe('painful');
    });
    it('decisionLocked + 비차단 페르소나 → prosCons만 빠진 3개', () => {
      const items = buildQueueSequence(makeArgs({
        persona: 'P12',
        daysElapsed: 10,
        decisionLocked: true,
      }));
      expect(kinds(items)).toEqual(['smartQ', 'aboutMe', 'memory']);
    });
  });
});
