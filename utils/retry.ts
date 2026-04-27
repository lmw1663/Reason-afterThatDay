// 지수 백오프 재시도 — AI 호출 일시 장애 대응
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelayMs = 500 } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastError = e;
      const err = e as { code?: string };

      // 타임아웃은 재시도해도 의미 없음 — 바로 fallback으로
      if (err.code === 'AI_TIMEOUT') throw e;

      if (attempt < maxAttempts - 1) {
        const delay = baseDelayMs * 2 ** attempt; // 500ms → 1000ms → 2000ms
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
