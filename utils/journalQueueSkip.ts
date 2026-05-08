// 일기 통합 큐 스킵 정책 — 순수 헬퍼.
//
// "다음에" 스킵된 항목은 KST 자정을 anchor로 *다음날 우선노출*된다.
// 본 모듈은 store/네트워크 비의존 — 단위 테스트 가능.
//
// 정책 SSOT: docs/journal-unified-queue.md

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export interface SkipRecord {
  /** YYYY-MM-DD KST */
  date: string;
  ids: string[];
}

/** 현재 시각의 KST 자정 기준 YYYY-MM-DD. */
export function todayKstString(now: number = Date.now()): string {
  return new Date(now + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 두 YYYY-MM-DD 문자열 사이의 일 수 차이. day1 < day2이면 양수. */
function daysBetween(day1: string, day2: string): number {
  const d1 = new Date(`${day1}T00:00:00Z`).getTime();
  const d2 = new Date(`${day2}T00:00:00Z`).getTime();
  return Math.round((d2 - d1) / (24 * 60 * 60 * 1000));
}

/**
 * 저장된 스킵 record에서 *오늘 우선노출 대상 ID*만 추출.
 *  - record null → 빈 Set
 *  - record date === today → 오늘 누적이라 우선노출 X (이미 큐에서 제외됨)
 *  - record date 어제(today-1) → priority (정상 케이스)
 *  - record date 며칠 전(today-2 이상) → 만료, priority X (오늘 페르소나 곡선과 무관)
 */
export function selectPriorityFromRecord(
  record: SkipRecord | null,
  today: string,
): Set<string> {
  if (!record) return new Set();
  const diff = daysBetween(record.date, today);
  if (diff !== 1) return new Set();
  return new Set(record.ids);
}

/** 한 record에 누적 가능한 최대 ids 수 — 무한 누적 차단. 초과 시 가장 오래된 것부터 drop. */
export const SKIP_RECORD_MAX_IDS = 50;

/**
 * 새 스킵 항목을 record에 누적.
 *  - record가 오늘이면 ids 끝에 push (dedup — 같은 id 중복 시 기존 위치 유지하고 추가 X)
 *  - record가 어제(또는 미존재)면 새 record 생성
 *  - 누적 ids 수가 `SKIP_RECORD_MAX_IDS`를 넘으면 가장 오래된 항목부터 잘라냄
 */
export function appendSkippedId(
  current: SkipRecord | null,
  id: string,
  today: string,
): SkipRecord {
  if (current && current.date === today) {
    if (current.ids.includes(id)) {
      // dedup — 같은 항목 반복 스킵 시 record는 그대로
      return current;
    }
    const next = [...current.ids, id];
    return {
      date: today,
      ids: next.length > SKIP_RECORD_MAX_IDS ? next.slice(-SKIP_RECORD_MAX_IDS) : next,
    };
  }
  return { date: today, ids: [id] };
}
