// @ts-nocheck — Deno runtime
import OpenAI from 'npm:openai';
import { createClient } from 'npm:@supabase/supabase-js';
import { buildSystemPrompt, lintResponse, appendAutoMessage } from '../_shared/personaPrompts.ts';
import { isProcessingSuspended } from '../_shared/processingSuspension.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });

const BASE_SYSTEM_PROMPT =
  '이별 후 회복 중인 사람에게 오늘 하루 힘이 될 짧은 한마디를 써줘. 1~2문장, 따뜻하고 단정하지 않게.';

const FALLBACKS = [
  '오늘도 한 걸음씩. 네 속도가 맞는 속도야.',
  '감정은 정답이 없어. 지금 느끼는 게 진짜야.',
  '이 시간이 너를 단단하게 만들고 있어.',
  '흔들려도 괜찮아. 뿌리는 여기 있어.',
  '오늘 하루 수고했어.',
];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { daysElapsed, userId, persona } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // X-1-잔여 §37: AI 분석 정지 의사가 있으면 fallback만 반환 (OpenAI 호출 X)
    if (userId && (await isProcessingSuspended(supabase, userId, 'ai_analysis'))) {
      const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      return new Response(
        JSON.stringify({ response: fallback, suspended: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // 같은 날 같은 사용자에게 동일한 한마디 반환 (사전생성 캐시 역할)
    const today = new Date().toISOString().slice(0, 10);

    const { data: cached } = await supabase
      .from('journal_entries')
      .select('ai_response')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .not('ai_response', 'is', null)
      .limit(1)
      .single();

    if (cached?.ai_response) {
      return new Response(
        JSON.stringify({ response: cached.ai_response }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const res = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(BASE_SYSTEM_PROMPT, persona ?? null),
        },
        { role: 'user', content: `이별 후 D+${daysElapsed}일째야.` },
      ],
      max_tokens: 80,
      temperature: 0.9,
    });

    const raw = res.choices[0].message.content ?? '';
    const lint = lintResponse(raw, persona ?? null);
    if (!lint.ok) {
      console.warn('[ai-daily-quote] persona lint violation:', persona, lint.violations);
      const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
      return new Response(
        JSON.stringify({ response: fallback }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ response: appendAutoMessage(raw, persona ?? null) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch {
    const fallback = FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
    return new Response(
      JSON.stringify({ response: fallback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
