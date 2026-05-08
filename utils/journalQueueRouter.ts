// 일기 통합 큐 라우터 — Q-2
//
// 일기 3/N 단계에서 [장단점 / 스마트Q / about-me / memory] 풀에서 페르소나·D+N·
// 최근 응답·스킵 이력을 종합해 *순서대로 답할 항목 시퀀스*를 1번에 빌드한다.
//
// 순수 함수 — store/네트워크 비의존. 호출처(useJournalQueue 훅)에서 데이터를 모아 전달.
//
// 정책 SSOT: docs/journal-unified-queue.md
// 헬퍼 SSOT: constants/personaBranches.ts Ref-7 (`isJournalProsConsBlocked` 등)

import type { PersonaCode } from './personaClassifier';
import type { Question } from '@/store/useQuestionStore';
import type { ReflectionCategory } from '@/api/selfReflections';
import {
  isJournalProsConsBlocked,
  getJournalProsConsRatio,
  getJournalQueueMaxLength,
  isMemoryGlamourBlocked,
  sortAboutMeCategories,
} from '@/constants/personaBranches';

/** 일기 통합 큐의 추억 회상 카테고리 — `app/memory/index.tsx`와 정합. */
export type JournalMemoryCategory = 'happy' | 'miss' | 'painful' | 'growth';

export type QueueItemKind = 'smartQ' | 'aboutMe' | 'memory' | 'prosCons';

export interface QueueItem {
  /** 큐 항목 고유 ID — skip 추적·중복 방지에 사용. 형식: `<kind>:<payload>` */
  id: string;
  kind: QueueItemKind;
  smartQ?: Question;
  aboutMe?: ReflectionCategory;
  memory?: JournalMemoryCategory;
  prosCons?: 'pros' | 'cons';
}

/** 사용자가 답변한 큐 항목 — Q-4 화면에서 수집 후 Q-5에서 도메인 라우팅. */
export interface QueueAnswerPayload {
  id: string;
  kind: QueueItemKind;
  smartQId?: string;
  aboutMeCategory?: ReflectionCategory;
  memoryCategory?: JournalMemoryCategory;
  prosCons?: 'pros' | 'cons';
  text: string;
}

export interface BuildQueueArgs {
  /** effective 페르소나 (`resolvePersona`의 effective). */
  persona: PersonaCode | null;
  /** R5 guardOverlay — 부 페르소나 금기를 추가 적용. */
  guardOverlayPersona?: PersonaCode | null;
  /** D+N (이별 경과일). 큐 길이·단점/장점 비율·곡선 결정. */
  daysElapsed: number;
  /** C-SSRS 양성 잠금 — 분석성(장단점) 풀 자동 제외. */
  decisionLocked: boolean;
  /** `useSmartQuestion` 결과 — null이면 스마트Q 슬롯 생략. */
  smartQ: Question | null;
  /** 최근 7일 답한 about-me 카테고리 (반복 회피). */
  recentlyServedAboutMe: readonly ReflectionCategory[];
  /** 최근 7일 답한 memory 카테고리 (반복 회피). */
  recentlyServedMemory: readonly JournalMemoryCategory[];
  /** 오늘 이미 prosCons 응답된 종류 — 중복 방지. */
  prosConsAnsweredToday: { pros: boolean; cons: boolean };
  /** 어제 "다음에"로 스킵된 항목 ID (TTL 1일) — 큐 앞으로 우선 정렬. */
  prioritySkippedIds: ReadonlySet<string>;
  /** prosCons 단점/장점 결정론적 선택용 시드 — daysElapsed 권장. */
  seed: number;
}

/** about-me 14 카테고리 default 순서 (페르소나별 정렬은 `sortAboutMeCategories`로 보강). */
const ABOUT_ME_DEFAULT_ORDER: readonly ReflectionCategory[] = [
  'self_love',
  'strengths',
  'self_care_in_relationship',
  'self_care_alone',
  'love_self',
  'ideal_match',
  'reality_check',
  'body',
  'needs',
  'identity',
];

/** memory 4 카테고리 default 순서 — 회복 작업(아팠던 순간·성장) 우선, 미화 후순위. */
const MEMORY_DEFAULT_ORDER: readonly JournalMemoryCategory[] = [
  'painful',
  'growth',
  'happy',
  'miss',
];

/** 미화 차단 페르소나가 지키는 카테고리 — 'happy'·'miss' 제거. */
const GLAMOUR_RISK_MEMORY: readonly JournalMemoryCategory[] = ['happy', 'miss'];

function appliesGuardLocal(
  effective: PersonaCode | null,
  overlay: PersonaCode | null,
  guard: (p: PersonaCode | null) => boolean,
): boolean {
  if (guard(effective)) return true;
  if (overlay !== null && guard(overlay)) return true;
  return false;
}

/** 결정론적 prosCons 선택 — seed 기반 단점/장점 분배가 `ratio`에 수렴. */
function pickProsCons(
  ratio: number,
  seed: number,
  answeredToday: { pros: boolean; cons: boolean },
): 'pros' | 'cons' | null {
  // 단점·장점 둘 다 답했으면 추가 항목 없음
  if (answeredToday.pros && answeredToday.cons) return null;
  if (answeredToday.cons) return 'pros';
  if (answeredToday.pros) return 'cons';

  // 결정론적 — seed 해시로 [0,100) 매핑 후 ratio*100 비교
  const bucket = ((seed * 73 + 17) % 100 + 100) % 100;
  return bucket < ratio * 100 ? 'cons' : 'pros';
}

/**
 * 큐 시퀀스 빌드. 순수 함수.
 *
 * 결정 순서:
 *  1. SmartQ (있으면) — 큐 첫 항목
 *  2. About-me 1개 — 페르소나 정렬 + 최근 응답 회피
 *  3. Memory 1개 — 미화 차단 + 최근 응답 회피
 *  4. ProsCons (차단 페르소나·decisionLocked 통과 시) — ratio·answeredToday로 결정
 *  5. priorityskipped 우선 정렬 — 어제 스킵 항목을 앞으로
 *  6. 큐 길이 상한 (D+0~7=3, D+8+=5)
 */
export function buildQueueSequence(args: BuildQueueArgs): QueueItem[] {
  const {
    persona,
    guardOverlayPersona = null,
    daysElapsed,
    decisionLocked,
    smartQ,
    recentlyServedAboutMe,
    recentlyServedMemory,
    prosConsAnsweredToday,
    prioritySkippedIds,
    seed,
  } = args;

  const items: QueueItem[] = [];

  // 1) SmartQ
  if (smartQ) {
    items.push({
      id: `smartQ:${smartQ.id}`,
      kind: 'smartQ',
      smartQ,
    });
  }

  // 2) About-me — 페르소나 정렬 + 최근 응답 회피
  const aboutMeOrder = sortAboutMeCategories(ABOUT_ME_DEFAULT_ORDER, persona);
  const aboutMeRecentlySet = new Set(recentlyServedAboutMe);
  const aboutMePick =
    aboutMeOrder.find((c) => !aboutMeRecentlySet.has(c)) ?? aboutMeOrder[0];
  if (aboutMePick) {
    items.push({
      id: `aboutMe:${aboutMePick}`,
      kind: 'aboutMe',
      aboutMe: aboutMePick,
    });
  }

  // 3) Memory — 미화 차단 + 최근 응답 회피
  const memoryGlamourBlocked = appliesGuardLocal(
    persona,
    guardOverlayPersona,
    isMemoryGlamourBlocked,
  );
  const memoryAvail = MEMORY_DEFAULT_ORDER.filter(
    (c) => !memoryGlamourBlocked || !GLAMOUR_RISK_MEMORY.includes(c),
  );
  const memoryRecentlySet = new Set(recentlyServedMemory);
  const memoryPick =
    memoryAvail.find((c) => !memoryRecentlySet.has(c)) ?? memoryAvail[0];
  if (memoryPick) {
    items.push({
      id: `memory:${memoryPick}`,
      kind: 'memory',
      memory: memoryPick,
    });
  }

  // 4) ProsCons — 차단 페르소나·decisionLocked 통과 시
  const prosConsBlocked = appliesGuardLocal(
    persona,
    guardOverlayPersona,
    isJournalProsConsBlocked,
  );
  if (!prosConsBlocked && !decisionLocked) {
    const ratio = getJournalProsConsRatio(persona, daysElapsed);
    const pick = pickProsCons(ratio, seed, prosConsAnsweredToday);
    if (pick) {
      items.push({
        id: `prosCons:${pick}`,
        kind: 'prosCons',
        prosCons: pick,
      });
    }
  }

  // 5) priorityskipped 우선 정렬 (안정 정렬 — 같은 우선순위 내 원래 순서 유지)
  if (prioritySkippedIds.size > 0) {
    items.sort((a, b) => {
      const aSkipped = prioritySkippedIds.has(a.id) ? 1 : 0;
      const bSkipped = prioritySkippedIds.has(b.id) ? 1 : 0;
      return bSkipped - aSkipped;
    });
  }

  // 6) 큐 길이 상한
  const maxLength = getJournalQueueMaxLength(daysElapsed);
  return items.slice(0, maxLength);
}
