# 공통 API 에러 코드 표준

모든 `api/*.ts`에서 공통 에러 코드를 사용하고, UI는 코드 기반으로 대응 분기한다.

```ts
// constants/errors.ts
export const AppError = {
  // AI
  AI_TIMEOUT:        'AI_TIMEOUT',        // GPT 5초 초과 -> fallback 표시
  AI_FAILED:         'AI_FAILED',         // GPT 실패 -> fallback 표시

  // 권한/인증
  RLS_DENIED:        'RLS_DENIED',        // RLS 차단 -> 재로그인 유도
  AUTH_REQUIRED:     'AUTH_REQUIRED',     // 미인증 -> 온보딩으로

  // 졸업 유예
  COOLING_ACTIVE:    'COOLING_ACTIVE',    // 유예 중 졸업 재신청 -> 안내 모달
  ALREADY_GRADUATED: 'ALREADY_GRADUATED', // 이미 졸업 확정 -> 홈으로

  // 데이터
  DUPLICATE_JOURNAL: 'DUPLICATE_JOURNAL', // 오늘 일기 중복 -> upsert 처리
  OFFLINE:           'OFFLINE',           // 네트워크 없음 -> 큐 저장 후 계속

  // 알림
  PUSH_DENIED:       'PUSH_DENIED',       // 푸시 권한 거부 -> 설정 안내
} as const;

export type AppErrorCode = typeof AppError[keyof typeof AppError];
```

```ts
// 사용 예시 — api/ai.ts
export async function fetchJournalResponse(ctx: JournalContext): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const { data, error } = await supabase.functions.invoke("ai-journal-response", {
      body: ctx,
      signal: controller.signal,
    });
    if (error) throw { code: AppError.AI_FAILED, detail: error };
    return data.response;
  } catch (e: any) {
    if (e.name === "AbortError") throw { code: AppError.AI_TIMEOUT };
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
```

