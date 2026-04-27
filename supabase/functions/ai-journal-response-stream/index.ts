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
규칙: 단정 금지 / 비난 금지 / 결정 강요 금지 / 가능성 제시
응답: 2~3문장, 공감 + 관찰 + 열린 질문 또는 응원, 반말
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
          content: `D+${daysElapsed}. 최근 감정: ${moodStr}. 방향: ${dirLabel}. 오늘: ${freeText ?? '없음'}`,
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
