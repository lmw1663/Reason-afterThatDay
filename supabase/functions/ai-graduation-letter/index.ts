// @ts-nocheck — Deno runtime
// gpt-4o 사용 — 매듭 편지는 긴 생성이 필요하기 때문
// X-2-B-3: 페르소나별 톤·금기 키워드 적용
import OpenAI from 'npm:openai';
import { buildSystemPrompt, lintResponse } from '../_shared/personaPrompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const BASE_SYSTEM_PROMPT = `
너는 사용자가 이별을 통해 성장하고 매듭을 짓는 순간을 함께하는 존재야.
사용자를 대신해서 "나에게 쓰는 편지"를 써줘.
규칙:
- 1인칭 (나는, 나에게)으로 작성
- 이별의 아픔과 성장을 모두 담기
- 비난 없이, 자신을 격려하는 내용
- 단정적 결론 없이, 앞으로를 열어두는 마무리
- 400~600자 분량
- 반말, 따뜻한 문체
- 사용자의 답변이 시간에 따라 *바뀌었어도* 변화 횟수("N번 바뀌었어"·"또"·"자꾸"·
  "결국"·"마침내"·"드디어"·"이제야") 절대 언급 금지. 변화는 *과정*으로 묘사하되
  *판정·평가* 회피 — "정리됐네"·"편해졌네"·"보이네" 같은 단정 어미도 금지
- 페르소나 라벨(P01~P20)·진단명(가스라이팅·회피형·불안형·트라우마 본딩·ROCD 등)
  사용자 노출 금지 — 분기 결과만 톤에 반영
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
    const {
      daysElapsed, moodAvg, reasons, pros, cons, journalCount,
      checkinMoods, checkinNotes, persona,
      reasonReflection, // Phase G — { first: {value, dPlus}, latest: {value, dPlus} } | null
    } = await req.json();

    const coolingSection = checkinMoods?.length
      ? `\n- 7일 유예 중 감정 변화: ${checkinMoods.join(' → ')}점${checkinNotes?.length ? `\n- 유예 중 메모: ${checkinNotes.slice(0, 2).join(' / ')}` : ''}`
      : '';

    // Phase G — 헤어진 이유 카테고리의 첫·최신 답변 변화 (있으면). 평가·횟수 강조 금지(BASE_SYSTEM_PROMPT)
    const reflectionSection = reasonReflection?.first?.value && reasonReflection?.latest?.value
      ? `\n- 헤어진 이유 처음 적었을 때 (D+${reasonReflection.first.dPlus ?? '?'}): "${reasonReflection.first.value}"\n- 같은 질문 가장 최근 답변 (D+${reasonReflection.latest.dPlus ?? '?'}): "${reasonReflection.latest.value}"`
      : '';

    const userPrompt = `
사용자 정보:
- 이별 후 D+${daysElapsed}일
- 평균 감정 온도: ${moodAvg ?? '?'}점
- 헤어진 이유: ${(reasons ?? []).join(', ') || '모름'}
- 좋았던 점: ${(pros ?? []).slice(0, 3).join(', ') || '없음'}
- 아쉬웠던 점: ${(cons ?? []).slice(0, 3).join(', ') || '없음'}
- 일기 작성 횟수: ${journalCount ?? 0}회${coolingSection}${reflectionSection}

이 정보를 바탕으로 사용자를 대신해 "나에게 쓰는 편지"를 써줘.
    `.trim();

    const res = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: buildSystemPrompt(BASE_SYSTEM_PROMPT, persona ?? null) },
        { role: 'user',   content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.85,
    });

    const raw = res.choices[0].message.content ?? '';
    const lint = lintResponse(raw, persona ?? null);
    if (!lint.ok) {
      console.warn('[ai-graduation-letter] persona lint violation:', persona, lint.violations);
      return new Response(
        JSON.stringify({ response: FALLBACK_LETTER }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ response: raw }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    return new Response(
      JSON.stringify({ response: FALLBACK_LETTER }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
