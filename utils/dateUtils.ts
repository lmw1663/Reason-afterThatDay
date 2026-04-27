// D+N 계산 — 시각(시/분/초) 제거 후 로컬 날짜만 비교 (타임존 자정 경계 오차 방지)
export function calcDaysElapsed(breakupDate: Date): number {
  const now = new Date();
  const localNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const localBreakup = new Date(
    breakupDate.getFullYear(),
    breakupDate.getMonth(),
    breakupDate.getDate(),
  );
  return Math.max(
    0,
    Math.floor((localNow.getTime() - localBreakup.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

// "YYYY-MM-DD" 문자열 → Date (Supabase date 타입 파싱)
export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Date → "YYYY-MM-DD" (Supabase date 타입 저장)
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
