// Phase F — react-native 의존성 없는 jsonb 응답값 포맷터.
//
// 이전엔 PreviousAnswerHint.tsx 안에 있었으나, 신규 테스트(`.test.ts`)가 컴포넌트
// 파일을 import하면 RN flow 파싱 실패 (vitest config 가 .tsx 제외). pure 모듈로
// 분리해 컴포넌트와 테스트 양쪽이 동일 함수를 공유하도록.

export function defaultPreviousAnswerFormatter(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : null;
  if (typeof v === 'boolean') return v ? '그래' : '아니야';
  if (Array.isArray(v)) {
    const items = v.filter((x) => x != null && x !== '').map(String);
    return items.length > 0 ? items.join(', ') : null;
  }
  return null;
}
