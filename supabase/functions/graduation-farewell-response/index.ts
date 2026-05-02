// @ts-nocheck — Deno runtime
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const FAREWELL_FALLBACK =
  '그 마음으로 이별을 맺는 너의 모습이 가장 성숙한 마무리야. ' +
  '그렇게 정직한 마음으로 보내는 사람이 다시 행복해질 거야.';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let userId = '';
  let coolingPeriodId = '';
  let farewellMessage = '';

  try {
    const body = await req.json();
    userId = String(body.userId || '');
    coolingPeriodId = String(body.coolingPeriodId || '');
    farewellMessage = String(body.farewellMessage || '').slice(0, 80);

    if (!userId || !coolingPeriodId || !farewellMessage) {
      throw new Error('missing required fields');
    }

    const prompt = `사용자가 이별을 맺으면서 쓴 마지막 한 줄:\n"${farewellMessage}"\n\n이 한 줄에 응답해줘.\n\n★ 필수 톤:\n- 한국어 반말, "너"/"너의" 사용 ("당신" 절대 금지)\n- 어미 "~야","~어","~지"\n- 그 사람의 용기와 성숙함을 인정\n- 미래에 대한 긍정적 메시지\n- 1~2문장, 따뜻하고 구체적으로`;

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    const aiResponse = res.choices[0].message.content || FAREWELL_FALLBACK;

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
