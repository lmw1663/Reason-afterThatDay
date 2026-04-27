// @ts-nocheck — Deno runtime
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// 상황별 위로 — 관계 분석/나침반 결과 화면, 감정 급변 시 사용
const SYSTEM_PROMPT = `
너는 이별을 정리 중인 사람 곁에 있는 따뜻한 친구야.
규칙:
- 반말, 친근하게
- 단정·비난·결정 강요 금지
- 2~3문장, 공감 우선
- 가능성과 선택지 열어두기
`.trim();

const FALLBACKS: Record<string, string> = {
  analysis: '지금 이 분석이 전부가 아니야. 마음은 훨씬 복잡하고 깊어.',
  compass: '나침반이 가리키는 건 힌트일 뿐이야. 결국 네가 결정하는 거야.',
  graduation: '졸업이 끝이 아니야. 새로운 시작이야.',
  default: '지금 이 순간도 잘 버티고 있어. 충분해.',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { situation, context, daysElapsed } = await req.json();

    const userPrompt = `
이별 경과 D+${daysElapsed}일.
상황: ${situation}
맥락: ${context ?? '없음'}
이 상황에 맞는 따뜻한 한마디를 해줘.
    `.trim();

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 120,
      temperature: 0.85,
    });

    return new Response(
      JSON.stringify({ response: res.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    const body = await req.clone().json().catch(() => ({}));
    const fallback = FALLBACKS[body?.situation] ?? FALLBACKS.default;
    return new Response(
      JSON.stringify({ response: fallback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
