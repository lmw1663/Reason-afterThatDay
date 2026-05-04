import { supabase } from './supabase';

// D-4 자가 보고 연락 카운터 — 1탭 보고 + 7일 윈도우 추세.
//
// 정책:
//  · 1탭 = 1행 insert (urge_count는 reserved, 현재는 항상 1)
//  · 7일 윈도우는 *오늘 포함* 직전 7일 (today − 6 ~ today)
//  · 본인 데이터만 — RLS가 강제. 호출자는 자기 userId만 넘길 것

export interface ContactUrge {
  id: string;
  reportedAt: string;
  urgeCount: number;
  actedOn: boolean | null;
}

/** 1탭 보고 — 단일 row insert. */
export async function recordUrge(userId: string): Promise<void> {
  const { error } = await supabase.from('contact_urges').insert({
    user_id: userId,
    urge_count: 1,
  });
  if (error) throw error;
}

/**
 * 직전 7일 일별 카운트 — 오늘 포함, 과거 6일까지 총 7일.
 * 반환 배열은 *과거 → 오늘* 시간순 (sparkline용). 빈 날은 count=0.
 */
export async function fetchUrgeTrend(
  userId: string,
): Promise<Array<{ date: string; count: number }>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  const { data, error } = await supabase
    .from('contact_urges')
    .select('reported_at')
    .eq('user_id', userId)
    .gte('reported_at', start.toISOString())
    .order('reported_at', { ascending: true });
  if (error) throw error;

  const counts = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    counts.set(toDateKey(d), 0);
  }
  for (const row of data ?? []) {
    const key = toDateKey(new Date(row.reported_at as string));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([date, count]) => ({ date, count }));
}

/** 오늘 카운트 1개만 — 칩의 누적 표시용. */
export async function fetchTodayUrgeCount(userId: string): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count, error } = await supabase
    .from('contact_urges')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('reported_at', today.toISOString());
  if (error) throw error;
  return count ?? 0;
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
