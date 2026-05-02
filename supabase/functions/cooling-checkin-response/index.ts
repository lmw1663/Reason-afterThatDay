// @ts-nocheck — Deno runtime
import OpenAI from 'npm:openai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const SYSTEM_PROMPT = `
당신은 이별을 경험한 사용자의 유예 체크인 응답자입니다.

★ 응답 톤 (필수):
- 한국어 친근한 반말로 응답할 것
- "너", "너는", "너의"를 사용 (절대 "당신" 사용 금지)
- 어미는 "~야", "~어", "~지" (절대 "~예요", "~어요" 금지)

★ 내용 원칙:
- 결정을 흔들지 않으면서도 지지하기
- "졸업이 잘못되었다"는 암시 금지
- "그만 생각하고 잊어버려" 같은 회피 조장 금지
- 단정 금지, 가능성 제시, 비난 금지
- 응답: 1~2문장, 따뜻하고 구체적인 반말 메시지

★ Day별 심리 단계:
Day 1: 충격/충격 — 호흡과 안정
Day 2: 후회 정상화 — 고민의 가치 인정
Day 3: 분노 수용 — 분노도 정상임을 알리기
Day 4: 슬픔 지지 — 슬픔의 깊이 인정
Day 5: 의미 탐색 — 배움 찾기 응원
Day 6: 미래 응원 — 미래 그리기 지지
Day 7: 최종 결정 지지 (양방향) — 어떤 선택이든 존중
`.trim();

const FALLBACK_BY_DAY: Record<number, string> = {
  1: '첫 하루를 견뎌낸 것만으로 충분해. 천천히 호흡해보자.',
  2: '지금 흔들리는 것도 정상이야. 너는 충분히 고민했던 사람이야.',
  3: '미움이나 분노가 떠올라도 괜찮아. 그것도 너의 정직한 마음이야.',
  4: '슬픔이 깊어지는 것은 그 관계가 너에게 소중했다는 뜻이야.',
  5: '배움을 찾기 시작했다는 것 자체가 회복의 신호야.',
  6: '미래를 그리고 있다면 충분히 회복하고 있는 거야.',
  7: '7일을 견뎌낸 너의 마음이 가장 정확한 답이야.',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let day = 1;
  let checkinText = '';

  try {
    const body = await req.json();
    day = Number(body.day) || 1;
    checkinText = String(body.checkinText || '');

    const userPrompt = `[Day ${day}] 유예 기간 중 체크인\n사용자의 말: "${checkinText}"`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return new Response(
      JSON.stringify({ response: res.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    const fallback = FALLBACK_BY_DAY[day] ?? FALLBACK_BY_DAY[1];
    return new Response(
      JSON.stringify({ response: fallback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
