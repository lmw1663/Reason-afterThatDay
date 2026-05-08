import { describe, it, expect } from 'vitest';
import {
  todayKstString,
  selectPriorityFromRecord,
  appendSkippedId,
} from '@/utils/journalQueueSkip';

describe('todayKstString — KST 자정 anchor', () => {
  it('UTC 00:00 → KST 09:00 → 같은 날짜', () => {
    const utc = Date.UTC(2026, 4, 8, 0, 0, 0);
    expect(todayKstString(utc)).toBe('2026-05-08');
  });
  it('UTC 14:30 → KST 23:30 → 같은 날짜', () => {
    const utc = Date.UTC(2026, 4, 7, 14, 30, 0);
    expect(todayKstString(utc)).toBe('2026-05-07');
  });
  it('UTC 16:00 → KST 다음날 01:00 → 다음 날짜로 넘어감', () => {
    const utc = Date.UTC(2026, 4, 7, 16, 0, 0);
    expect(todayKstString(utc)).toBe('2026-05-08');
  });
  it('UTC 14:59 → KST 23:59 → 아직 오늘', () => {
    const utc = Date.UTC(2026, 4, 7, 14, 59, 0);
    expect(todayKstString(utc)).toBe('2026-05-07');
  });
});

describe('selectPriorityFromRecord — 어제(today-1)만 priority, 그 외 만료', () => {
  it('record null → 빈 Set', () => {
    expect(selectPriorityFromRecord(null, '2026-05-08').size).toBe(0);
  });
  it('record date === today → 오늘 누적이라 빈 Set', () => {
    const rec = { date: '2026-05-08', ids: ['memory:painful', 'aboutMe:body'] };
    expect(selectPriorityFromRecord(rec, '2026-05-08').size).toBe(0);
  });
  it('record date 어제(today-1) → 모든 ids가 priority', () => {
    const rec = { date: '2026-05-07', ids: ['memory:painful', 'aboutMe:body'] };
    const result = selectPriorityFromRecord(rec, '2026-05-08');
    expect(result.size).toBe(2);
    expect(result.has('memory:painful')).toBe(true);
    expect(result.has('aboutMe:body')).toBe(true);
  });
  it('record date 이틀 전(today-2) → 만료, 빈 Set', () => {
    const rec = { date: '2026-05-06', ids: ['smartQ:x'] };
    expect(selectPriorityFromRecord(rec, '2026-05-08').size).toBe(0);
  });
  it('record date 며칠 전 → 만료, 빈 Set (오늘 페르소나 곡선과 무관)', () => {
    const rec = { date: '2026-04-01', ids: ['smartQ:j_today_mood'] };
    expect(selectPriorityFromRecord(rec, '2026-05-08').size).toBe(0);
  });
  it('record date 미래(잘못된 시계 등) → 안전상 무시', () => {
    const rec = { date: '2026-05-09', ids: ['memory:painful'] };
    expect(selectPriorityFromRecord(rec, '2026-05-08').size).toBe(0);
  });
});

describe('appendSkippedId — 스킵 누적 + dedup + 상한', () => {
  it('record null → 새 record 생성 (오늘 1개)', () => {
    const result = appendSkippedId(null, 'memory:painful', '2026-05-08');
    expect(result).toEqual({ date: '2026-05-08', ids: ['memory:painful'] });
  });
  it('record 어제 → 새 record 생성 (오늘 1개) — 어제 ids 버림', () => {
    const rec = { date: '2026-05-07', ids: ['aboutMe:body'] };
    const result = appendSkippedId(rec, 'memory:painful', '2026-05-08');
    expect(result).toEqual({ date: '2026-05-08', ids: ['memory:painful'] });
  });
  it('record 오늘 → 같은 record에 ids 누적', () => {
    const rec = { date: '2026-05-08', ids: ['aboutMe:body'] };
    const result = appendSkippedId(rec, 'memory:painful', '2026-05-08');
    expect(result).toEqual({
      date: '2026-05-08',
      ids: ['aboutMe:body', 'memory:painful'],
    });
  });
  it('같은 id 중복 스킵 → record 그대로 (dedup)', () => {
    const rec = { date: '2026-05-08', ids: ['aboutMe:body'] };
    const result = appendSkippedId(rec, 'aboutMe:body', '2026-05-08');
    expect(result).toBe(rec); // 동일 참조 — 변경 없음
  });
  it('상한 50 초과 → 가장 오래된 것 drop', () => {
    const ids = Array.from({ length: 50 }, (_, i) => `id:${i}`);
    const rec = { date: '2026-05-08', ids };
    const result = appendSkippedId(rec, 'id:new', '2026-05-08');
    expect(result.ids.length).toBe(50);
    expect(result.ids[0]).toBe('id:1'); // id:0 drop
    expect(result.ids[49]).toBe('id:new');
  });
});
