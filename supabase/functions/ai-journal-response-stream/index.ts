// @ts-nocheck — Deno runtime
// 일기 AI 응답 스트리밍 버전 — 일기 작성 완료 직후 진입감 개선
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const SYSTEM_PROMPT = `
너는 이별을 정리 중인 사람의 감정 파트너야.
규칙:
- 단정 금지: "~해야 해", "~게 맞아" 같은 표현 금지
- 비난 금지: 상대방도 사용자도 비난하지 않음
- 결정 강요 금지: "잡아야 해", "보내야 해" 금지
- 가능성 제시: "~일 수도 있어", "~해 보여" 말투
- 응답: 2~3문장, 반말, 친구처럼 따뜻하게
- "당신" 절대 금지, "너/너의" 사용

방향별 응답 원칙 (가장 중요):
- 방향이 "잡고싶어"일 때: 그 마음을 인정하되, 충동과 진심을 구분해보도록 열린 질문
- 방향이 "보내고싶어"일 때: 그 용기를 인정하고, 앞을 향하는 마음을 응원
- 방향이 "모르겠어"일 때: 불확실함 자체가 정상임을 공감, 지금 당장 결정 안 해도 된다고 안심
`.trim();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moodScore, direction, freeText, recentMoods, daysElapsed } = await req.json();

    const moodStr = Array.isArray(recentMoods) ? recentMoods.join(', ') : '없음';
    const dirLabel = direction === 'catch' ? '잡고싶어' : direction === 'let_go' ? '보내고싶어' : '모르겠어';

    const stream = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `D+${daysElapsed}. 감정온도: ${moodScore}. 최근 감정 흐름: ${moodStr}. 방향: ${dirLabel}. 오늘 한 줄: ${freeText ?? '없음'}`,
        },
      ],
      max_tokens: 150,
      temperature: 0.8,
      stream: true,
    });

    // OpenAI stream → ReadableStream (SSE)
    const readable = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
          }
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'stream_failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
