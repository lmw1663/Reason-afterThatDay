// @ts-nocheck — Deno runtime
// X-2-B-3: 페르소나별 톤·금기 키워드 적용
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js';
import { buildSystemPrompt, lintResponse } from '../_shared/personaPrompts.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

// 페르소나 비노출·비단정 어휘 — 기존 fallback에 "성숙한 마무리"는 P07 매트릭스 §C9 금기
// ("성숙한 결정·어른스러움 강요 금지"). 중립 어휘로 변경.
const FAREWELL_FALLBACK =
  '여기까지 와줘서 고마워. 정직하게 마음을 적은 너의 한 줄이 매듭의 의미를 더 짙게 만들어.';

const BASE_SYSTEM_PROMPT = `
너는 사용자가 매듭을 짓는 순간 마지막 한 줄에 응답하는 존재야.
응답 규칙:
- 한국어 반말, "너"/"너의" ("당신" 절대 금지)
- 어미 "~야","~어","~지"
- 사용자의 용기를 인정 (단정·평가는 금지)
- 가벼운 미래 가능성 어조 (단정 결론 금지)
- 1~2문장, 따뜻하고 구체적으로
`.trim();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let userId = '';
  let coolingPeriodId = '';
  let farewellMessage = '';
  let persona: string | null = null;

  try {
    const body = await req.json();
    userId = String(body.userId || '');
    coolingPeriodId = String(body.coolingPeriodId || '');
    farewellMessage = String(body.farewellMessage || '').slice(0, 80);
    persona = (body.persona ?? null) as string | null;

    if (!userId || !coolingPeriodId || !farewellMessage) {
      throw new Error('missing required fields');
    }

    const userPrompt = `사용자가 매듭을 짓으며 쓴 마지막 한 줄:\n"${farewellMessage}"\n\n이 한 줄에 응답해줘.`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: buildSystemPrompt(BASE_SYSTEM_PROMPT, persona) },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 150,
      temperature: 0.8,
    });

    const raw = res.choices[0].message.content ?? '';
    const lint = lintResponse(raw, persona);
    if (!lint.ok) {
      console.warn('[graduation-farewell-response] persona lint violation:', persona, lint.violations);
    }
    const aiResponse = lint.ok && raw ? raw : FAREWELL_FALLBACK;

    // DB 저장 (Edge Function 내에서 service role로 insert)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('graduation_farewell').insert({
      user_id: userId,
      cooling_period_id: coolingPeriodId,
      user_message: farewellMessage,
      ai_response: aiResponse,
    });

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    // fallback: DB 저장 없이 응답만 반환
    return new Response(
      JSON.stringify({ response: FAREWELL_FALLBACK }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
