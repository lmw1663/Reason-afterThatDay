// @ts-nocheck — Deno runtime
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const SYSTEM_PROMPT = `
너는 이별을 정리 중인 사람의 감정 파트너야.
규칙:
- 단정 금지: "~해야 해", "~게 맞아" 같은 단정적 표현 사용하지 마
- 비난 금지: 상대방이나 사용자를 비난하는 표현 없이
- 결정 강요 금지: 어떤 선택을 강요하지 마
- 가능성 제시: "~일 수도 있어", "~해 보여" 말투 사용
- 응답: 2~3문장, 공감 + 관찰 + 열린 질문 또는 응원
- 말투: 친구처럼 따뜻하게, 존댓말 아닌 반말
`.trim();

function buildContext({ daysElapsed, recentMoods, direction, freeText }: Record<string, unknown>) {
  const moodStr = Array.isArray(recentMoods) && recentMoods.length
    ? (recentMoods as number[]).join(', ')
    : '없음';
  const dirLabel =
    direction === 'catch' ? '잡고싶어' : direction === 'let_go' ? '보내고싶어' : '모르겠어';

  return `
이별 경과: D+${daysElapsed}
최근 3일 감정 온도: ${moodStr}
오늘 방향: ${dirLabel}
오늘 입력: ${freeText ?? '없음'}
  `.trim();
}

function fallbackResponse(direction: unknown): string {
  if (direction === 'catch') return '잡고 싶은 마음이 느껴져. 그 마음 충분히 이해해.';
  if (direction === 'let_go') return '보내고 싶은 마음도 용기야. 잘 하고 있어.';
  return '지금 어떤 마음인지 정확히 몰라도 괜찮아. 그게 자연스러운 거야.';
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { moodScore, direction, freeText, recentMoods, daysElapsed } = body;

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: buildContext({ daysElapsed, recentMoods, direction, freeText }) },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    return new Response(
      JSON.stringify({ response: res.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    const body = await req.clone().json().catch(() => ({}));
    return new Response(
      JSON.stringify({ response: fallbackResponse(body?.direction) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
