// @ts-nocheck — Deno runtime
//
// 페르소나 재분류 cron — C-1-4
//
// 정책 근거: docs/psychology-logic/구현계획.md Task 2-4
//           docs/psychology-logic/페르소나-분류체계.md §6 시간 경과 재분류 규칙
//
// 매일 0시(서울) 실행. D+7, D+14, D+30, D+60, D+90 해당자 필터 → 최근 일기·검사 결과로
// axes 재계산 → personas 테이블에 새 active 행 insert (이전 active=false).
//
// 사용자 안내 X — 페르소나 라벨 비노출 원칙 (CLAUDE.md). 트랙이 *눈에 보이게* 변할 때만
// 사용자에게 "오늘은 다른 결의 카드가 더 도움될 거 같아" 식으로 *분기 결과만* 안내.
//
// ECR-R/RRS 라이선스 미확인 (B-0-1) — 본 cron은 일기 감정 라벨·mood_score 기반 휴리스틱 axes
// 추정만 사용. ECR-R 회신 후 본 함수 정확도 향상.
//
// 사별(P13) 제외 — classifyPersona가 P13을 반환하지 않음 (C-1-2).
//
// 배포: supabase functions deploy persona-reclassify-cron
// 스케줄: pg_cron으로 0 0 * * * Asia/Seoul (별도 마이그레이션에서 등록)

import { createClient } from 'npm:@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const RECLASSIFY_DAYS = [7, 14, 30, 60, 90] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const today = new Date();
  const stats = { processed: 0, reclassified: 0, errors: 0 };

  // breakup_date가 today - N일인 사용자 조회 (D+N에 해당)
  for (const days of RECLASSIFY_DAYS) {
    const target = new Date(today);
    target.setDate(target.getDate() - days);
    const targetDateStr = target.toISOString().split('T')[0];

    const { data: users, error: userErr } = await supabase
      .from('users')
      .select('id, breakup_date, onboarding_completed')
      .eq('breakup_date', targetDateStr)
      .eq('onboarding_completed', true);

    if (userErr) {
      console.error('[reclassify] user fetch failed:', userErr.message);
      stats.errors += 1;
      continue;
    }

    for (const user of users ?? []) {
      stats.processed += 1;
      try {
        // 멱등성 가드 — 오늘 같은 source(d7/d14/...)로 이미 axes 행이 있으면 skip.
        // cron이 같은 날 두 번 호출돼도 중복 행 생성 방지.
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: existing } = await supabase
          .from('psych_profile_axes')
          .select('id')
          .eq('user_id', user.id)
          .eq('source', `d${days}`)
          .gte('measured_at', todayStart.toISOString())
          .limit(1)
          .maybeSingle();
        if (existing) continue;

        await reclassifyForUser(user.id, days);
        stats.reclassified += 1;
      } catch (e) {
        console.error(`[reclassify] user ${user.id} D+${days} failed:`, e);
        stats.errors += 1;
      }
    }
  }

  return new Response(JSON.stringify(stats), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

/**
 * 사용자별 재분류:
 *  1. 가장 최근 active persona 조회 (이력)
 *  2. 가장 최근 axes 조회
 *  3. 최근 일기·검사 결과로 axes 갱신 (휴리스틱)
 *  4. 분류 알고리즘 실행 (classifyPersona는 클라이언트 utils에 있어 본 cron에선 SQL/JS 인라인 재구현)
 *  5. 변경 있으면 personas 새 행 insert + 이전 행 active=false
 */
async function reclassifyForUser(userId: string, days: number): Promise<void> {
  // 가장 최근 axes
  const { data: axes } = await supabase
    .from('psych_profile_axes')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!axes) {
    // 온보딩 axes 없는 사용자는 재분류 불가
    console.warn(`[reclassify] no axes for user ${userId}`);
    return;
  }

  // 최근 7일 일기에서 a7(정서지배) 갱신
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 7);
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('mood_score, emotion_labels')
    .eq('user_id', userId)
    .gte('entry_date', sinceDate.toISOString().split('T')[0])
    .order('entry_date', { ascending: false });

  const updatedAxes = updateAxesFromJournals(axes, recentEntries ?? []);

  // 새 axes 시계열 저장
  const source = `d${days}` as 'd7' | 'd14' | 'd30' | 'd60' | 'd90';
  const { error: axesErr } = await supabase
    .from('psych_profile_axes')
    .insert({
      user_id: userId,
      source,
      a1_attachment:       updatedAxes.a1_attachment,
      a2_initiator:        updatedAxes.a2_initiator,
      a3_breakup_mode:     updatedAxes.a3_breakup_mode,
      a4_duration:         updatedAxes.a4_duration,
      a5_health:           updatedAxes.a5_health,
      a6_complexity:       updatedAxes.a6_complexity,
      a7_dominant_emotion: updatedAxes.a7_dominant_emotion,
      a8_crisis:           updatedAxes.a8_crisis,
    });
  if (axesErr) throw axesErr;

  // 본 cron은 *axes 시계열 갱신*까지만. 페르소나 자체 재분류는 deferred.
  //
  // 정책 결정 (C-1-4):
  //  - personas.primary는 *분기 로직의 single source of truth*로 유지
  //  - axes 갱신은 *디버그·후속 분류 후보 데이터*로만 보존
  //  - 분류 변경은 (a) 사용자 능동 진입(추후 settings의 "내 모드 다시 평가") 또는
  //    (b) onboarding_responses 보존 후 서버 분류기 인라인(Phase D) 시점까지 deferred
  //
  // 결과: axes는 신선해질 수 있으나 personas는 stale 가능. 분기 로직은 *항상 personas 참조*.
  console.log(`[reclassify] user ${userId} D+${days} axes updated (personas unchanged — deferred)`);
}

/**
 * 일기 데이터로부터 a7(정서지배) 휴리스틱 갱신.
 * 최근 7일 emotion_labels에서 가장 많이 등장한 카테고리로 a7 추정.
 */
function updateAxesFromJournals(currentAxes: any, entries: any[]): any {
  if (entries.length === 0) return currentAxes;

  const emotionToAxis: Record<string, number> = {
    sadness: 0, sad: 0,
    anger: 1, angry: 1, betrayal: 1,
    guilt: 2, shame: 2,
    empty: 3, emptiness: 3, numb: 3,
    confused: 4, ambivalent: 4,
  };

  const tally = new Map<number, number>();
  for (const entry of entries) {
    const labels = (entry.emotion_labels ?? []) as string[];
    for (const label of labels) {
      const axis = emotionToAxis[label.toLowerCase()];
      if (axis !== undefined) tally.set(axis, (tally.get(axis) ?? 0) + 1);
    }
  }

  if (tally.size === 0) return currentAxes;

  const dominant = [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
  return { ...currentAxes, a7_dominant_emotion: dominant };
}
