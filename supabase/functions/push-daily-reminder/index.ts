// @ts-nocheck — Deno runtime
// pg_cron으로 매일 21:00 KST 실행
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

  // 유예 중(Day 1~6)인 user_id 목록 조회 — 이들에게는 알림 전면 중지
  const { data: coolingUsers } = await supabase
    .from('graduation_cooling')
    .select('user_id')
    .eq('status', 'cooling');

  const coolingUserIds = new Set((coolingUsers ?? []).map((r: { user_id: string }) => r.user_id));

  // 알림 받을 대상: push_token 있는 전체 사용자 - 유예 중인 사용자
  const { data: users } = await supabase
    .from('users')
    .select('id, push_token, breakup_date')
    .not('push_token', 'is', null);

  if (!users?.length) return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });

  const today = new Date().toISOString().slice(0, 10);
  const messages: unknown[] = [];

  for (const user of users) {
    if (coolingUserIds.has(user.id)) continue; // 유예 중 — 스킵

    // 오늘 일기 작성 여부 확인
    const { data: todayJournal } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('user_id', user.id)
      .gte('created_at', `${today}T00:00:00`)
      .limit(1)
      .single();

    if (todayJournal) continue; // 이미 작성 — 스킵

    // 마지막 작성 날짜 확인 (3일 미작성 시 독촉)
    const { data: lastEntry } = await supabase
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const daysSinceLastEntry = lastEntry
      ? Math.floor((Date.now() - new Date(lastEntry.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const body = daysSinceLastEntry >= 3
      ? `${daysSinceLastEntry}일 됐어. 잠깐만 오늘 기분은 어때?`
      : '오늘 하루는 어땠어? 잠깐 기록해봐.';

    messages.push({
      to: user.push_token,
      title: 'reason',
      body,
      data: { screen: 'journal' },
    });
  }

  if (messages.length) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
