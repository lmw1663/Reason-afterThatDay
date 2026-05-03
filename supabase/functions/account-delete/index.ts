// @ts-nocheck — Deno runtime
// X-1-잔여 계정 자체 삭제 Edge Function — PIPA §36 완전 처리.
//
// 흐름: 클라이언트 JWT 검증 → service role로 auth.admin.deleteUser →
//   public.users 행 ON DELETE CASCADE로 자식 모든 행 자동 삭제.
//
// 클라이언트는 본 함수 호출 후 supabase.auth.signOut() + AsyncStorage.clear() + router.replace('/').
// 본 함수 실패 시 기존 deleteAllUserData(클라이언트)로 DB 행만 정리하는 fallback 권장.

import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'no_auth', message: '인증 정보가 없어' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // JWT 검증 — anon key + Authorization 헤더로 본인 확인
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(
      JSON.stringify({ error: 'invalid_auth', message: '인증이 만료됐어. 다시 로그인해줘.' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
  const userId = userData.user.id;

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 서버측 안전 잠금 검증 — 위기 평가 양성 사용자의 충동 삭제 차단 (B-1 정책)
  // safety_lockouts.user_id는 PK라 사용자당 행 1개. released_at가 null이면 활성 잠금.
  const { data: lockoutRow } = await adminClient
    .from('safety_lockouts')
    .select('decision_locked, released_at')
    .eq('user_id', userId)
    .maybeSingle();
  const locked = lockoutRow?.decision_locked === true && !lockoutRow?.released_at;
  if (locked) {
    return new Response(
      JSON.stringify({
        error: 'safety_locked',
        message: '안전 확인 중이야. 잠금이 풀리면 삭제할 수 있어.',
      }),
      { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  // service role로 admin delete — auth.users 삭제 + 026 마이그레이션의 ON DELETE CASCADE로
  // public.users + 자식 모든 행 자동 삭제 (PIPA §36 완전 처리)
  const { error: deleteErr } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteErr) {
    return new Response(
      JSON.stringify({
        error: 'delete_failed',
        message: deleteErr.message,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  return new Response(
    JSON.stringify({ deleted: true, userId }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
