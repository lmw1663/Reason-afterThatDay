# Phase 3 — GPT Edge Functions / AI 응답 (원문 이관본)

## 3-1. Edge Functions 구조

**파일**
- `supabase/functions/ai-journal-response/index.ts`
- `supabase/functions/ai-daily-quote/index.ts`
- `supabase/functions/ai-comfort/index.ts`
- `supabase/functions/ai-graduation-letter/index.ts`

**ai-journal-response 스니펫**
```ts
// supabase/functions/ai-journal-response/index.ts
// ⚠️ deno.land/x/openai 는 버전/지원성 불안정 — Supabase 공식 권장 방식으로 고정
import OpenAI from 'npm:openai';  // npm: specifier — Supabase Edge Functions 공식 권장

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

Deno.serve(async (req) => {
  const { moodScore, direction, freeText, recentMoods, daysElapsed } = await req.json();

  const systemPrompt = `
    너는 이별을 정리 중인 사람의 감정 파트너야.
    규칙: 단정 금지 / 비난 금지 / 결정 강요 금지 / 가능성만 제시.
    응답: 2~3문장, 공감 + 관찰 + 열린 질문 or 응원.
  `;

  try {
    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: buildContext({ moodScore, direction, freeText, recentMoods, daysElapsed }) },
      ],
      max_tokens: 150,
    });
    return new Response(JSON.stringify({ response: res.choices[0].message.content }));
  } catch {
    // fallback 응답 — GPT 실패 시
    return new Response(JSON.stringify({
      response: fallbackResponse(direction, moodScore),
    }));
  }
});
```

**필수 컨텍스트 (모든 GPT 호출 공통)**
```ts
function buildContext({ daysElapsed, recentMoods, lastDirection, freeText }) {
  return `
    이별 경과: D+${daysElapsed}
    최근 3일 감정 온도: ${recentMoods.join(', ')}
    최근 방향: ${lastDirection}
    오늘 입력: ${freeText ?? '없음'}
  `;
}
```

**fallback 템플릿**
```ts
function fallbackResponse(direction: Direction, score: number): string {
  if (direction === 'catch') return "잡고 싶은 마음이 느껴져. 그 마음 충분히 이해해.";
  if (direction === 'let_go') return "보내고 싶은 마음도 용기야. 잘 하고 있어.";
  return "지금 어떤 마음인지 정확히 몰라도 괜찮아. 그게 자연스러운 거야.";
}
```

**트레이드오프**
- `gpt-4.1-mini` vs `gpt-4o`: mini는 비용 1/10, 공감 응답 2~3문장에는 충분. 졸업 편지처럼 긴 생성이 필요한 경우에만 상위 모델 고려.
- 응답 캐싱: 동일 맥락 재호출 방지를 위해 `(user_id, date)` 기준 1회 캐싱 고려.

--mini로 하는데 조금 복잡한 문장 구현을 하려면 4o를 쓰자

---

## 3-2. 클라이언트 AI API 레이어

**파일**
- `api/ai.ts`

```ts
// api/ai.ts — Edge Function 프록시 호출만 허용
export async function fetchJournalResponse(ctx: JournalContext): Promise<string> {
  const { data, error } = await supabase.functions.invoke('ai-journal-response', { body: ctx });
  if (error) throw error;
  return data.response;
}
// ⚠️ OpenAI 직접 호출 절대 금지
```

