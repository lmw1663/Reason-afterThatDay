// @ts-nocheck — Deno runtime
// gpt-4o 사용 — 졸업 편지는 긴 생성이 필요하기 때문
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const SYSTEM_PROMPT = `
너는 사용자가 이별을 통해 성장하고 졸업하는 순간을 함께하는 존재야.
사용자를 대신해서 "나에게 쓰는 편지"를 써줘.
규칙:
- 1인칭 (나는, 나에게)으로 작성
- 이별의 아픔과 성장을 모두 담기
- 비난 없이, 자신을 격려하는 내용
- 단정적 결론 없이, 앞으로를 열어두는 마무리
- 400~600자 분량
- 반말, 따뜻한 문체
`.trim();

const FALLBACK_LETTER = `
지금 이 순간까지 버텨온 나에게.

쉽지 않았어. 그 마음 알아. 어떤 날은 그냥 모든 게 멈춰버렸으면 했고, 어떤 날은 이게 다 내 잘못인 것 같아서 힘들었지.

그런데 있잖아, 지금 여기까지 온 것만으로도 충분해. 완벽하지 않아도 괜찮아. 아직 다 정리되지 않아도 괜찮아.

앞으로 어떻게 될지 모르겠어. 근데 그게 나쁜 건 아닐 것 같아. 아직 쓰여지지 않은 페이지가 있다는 거니까.

오늘 이 순간, 조금은 가볍게 앞을 볼 수 있기를.
`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { daysElapsed, moodAvg, reasons, pros, cons, journalCount } = await req.json();

    const userPrompt = `
사용자 정보:
- 이별 후 D+${daysElapsed}일
- 평균 감정 온도: ${moodAvg ?? '?'}점
- 헤어진 이유: ${(reasons ?? []).join(', ') || '모름'}
- 좋았던 점: ${(pros ?? []).slice(0, 3).join(', ') || '없음'}
- 아쉬웠던 점: ${(cons ?? []).slice(0, 3).join(', ') || '없음'}
- 일기 작성 횟수: ${journalCount ?? 0}회

이 정보를 바탕으로 사용자를 대신해 "나에게 쓰는 편지"를 써줘.
    `.trim();

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.85,
    });

    return new Response(
      JSON.stringify({ response: res.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ response: FALLBACK_LETTER }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
