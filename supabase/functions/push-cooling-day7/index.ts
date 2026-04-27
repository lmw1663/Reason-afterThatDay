// @ts-nocheck — Deno runtime
// pg_cron으로 매일 실행 — Day 7 최종 알림 1회 전용 (체크인 독촉과 혼용 금지)
import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // status='cooling' AND cooling_ends_at <= now() AND notifications_sent = 0
  const { data: readyCooling } = await supabase
    .from('graduation_cooling')
    .select('id, user_id')
    .eq('status', 'cooling')
    .eq('notifications_sent', 0)
    .lte('cooling_ends_at', new Date().toISOString());

  if (!readyCooling?.length) {
    return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });
  }

  const messages: unknown[] = [];
  const sentIds: string[] = [];

  for (const cooling of readyCooling) {
    const { data: user } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', cooling.user_id)
      .single();

    if (!user?.push_token) continue;

    messages.push({
      to: user.push_token,
      title: '🎓 reason',
      body: '7일이 지났어. 지금 마음이 어때? 최종 확인을 해봐.',
      data: { screen: 'cooling' },
    });
    sentIds.push(cooling.id);
  }

  if (messages.length) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });

    // 발송 후 notifications_sent = 1 업데이트 (중복 방지)
    await supabase
      .from('graduation_cooling')
      .update({ notifications_sent: 1 })
      .in('id', sentIds);
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
