// @ts-nocheck — Deno runtime
// F-9 후속 — 매듭 회상 의식 푸시 cron
//
// pg_cron으로 매일 실행. knot_revisit_schedule에서 due한 row(scheduled_at <= now() AND
// triggered_at IS NULL) 조회 → 사용자별 push_token으로 Expo Push 발송 → triggered_at 마킹.
//
// 페르소나별 본문 (utils/knotRevisit RITUAL_COPY와 동기화):
//   - d30_revisit:        한 달이 지났어 / 그때의 결정을 한 번 다시 들여다볼래?
//   - d60_revisit:        두 달이 지났어 / 한 번 더 만나볼게.
//   - d30_cycle_review:   한 주가 지났어 / 이번 사이클은 지난번이랑 뭐가 달랐어?
//
// 처리정지(§37) 사용자는 스킵 — push-cooling-day7과 동일 패턴.
// 페르소나 라벨 비노출 절대 규칙 — 본문에 페르소나 코드·진단명 어휘 없음.
import { createClient } from 'npm:@supabase/supabase-js';
import { fetchSuspendedUserIds } from '../_shared/processingSuspension.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type RitualType = 'd30_revisit' | 'd60_revisit' | 'd30_cycle_review';

const PUSH_COPY: Record<RitualType, { title: string; body: string }> = {
  d30_revisit: {
    title: '한 달이 지났어',
    body: '그때의 결정을 한 번 다시 들여다볼래?',
  },
  d60_revisit: {
    title: '두 달이 지났어',
    body: '한 번 더 만나볼게. 지금의 너와 그때의 결정.',
  },
  d30_cycle_review: {
    title: '한 주가 지났어',
    body: '이번 사이클은 지난번이랑 뭐가 달랐어?',
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // due한 회상 의식 schedule — 발화 안 된 것만 (cancelRevisitsForCooling이 cancel 시 마킹하므로 함께 제외됨)
  const { data: dueRows } = await supabase
    .from('knot_revisit_schedule')
    .select('id, user_id, ritual_type')
    .is('triggered_at', null)
    .lte('scheduled_at', new Date().toISOString());

  if (!dueRows?.length) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // §37 처리정지 사용자 일괄 스킵 (N+1 회피)
  const suspendedUserIds = await fetchSuspendedUserIds(
    supabase,
    dueRows.map((r: { user_id: string }) => r.user_id),
    'notifications',
  );

  // F-12 P1-A 정합 — 새 매듭 cooling 진행 중인 사용자에게 이전 매듭의 회상 push 차단
  // (CLAUDE.md "유예 중 일반 알림 전면 중지" 절대 규칙). 클라이언트 useRevisitTrigger와 동일 가드.
  const { data: activeCooling } = await supabase
    .from('graduation_cooling')
    .select('user_id')
    .eq('status', 'cooling')
    .in('user_id', dueRows.map((r: { user_id: string }) => r.user_id));
  const coolingUserIds = new Set(
    (activeCooling ?? []).map((c: { user_id: string }) => c.user_id),
  );

  // 처리정지·유예 진행 중 모두 제외
  const eligibleRows = dueRows.filter(
    (r: { user_id: string }) =>
      !suspendedUserIds.has(r.user_id) && !coolingUserIds.has(r.user_id),
  );
  const userIds = Array.from(new Set(eligibleRows.map((r: { user_id: string }) => r.user_id)));
  const { data: users } = await supabase
    .from('users')
    .select('id, push_token')
    .in('id', userIds);
  const pushTokenByUserId = new Map<string, string>();
  for (const u of users ?? []) {
    if (u.push_token) pushTokenByUserId.set(u.id as string, u.push_token as string);
  }

  const messages: unknown[] = [];
  const sentIds: string[] = [];

  for (const row of eligibleRows) {
    const token = pushTokenByUserId.get(row.user_id);
    if (!token) continue;
    const copy = PUSH_COPY[row.ritual_type as RitualType];
    if (!copy) continue;
    messages.push({
      to: token,
      title: copy.title,
      body: copy.body,
      // 클라이언트 라우팅 — usePushNotifications가 'knot/revisit' deep link 처리 (F-9)
      data: { screen: 'knot/revisit', id: row.id, ritualType: row.ritual_type },
    });
    sentIds.push(row.id);
  }

  if (messages.length) {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    // 발송 성공 후 triggered_at 마킹 (중복 발송 방지)
    await supabase
      .from('knot_revisit_schedule')
      .update({ triggered_at: new Date().toISOString() })
      .in('id', sentIds);
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
