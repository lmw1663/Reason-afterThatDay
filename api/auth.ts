import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

export type OAuthProvider = 'google' | 'apple' | 'kakao';

const REDIRECT_URL = 'reason://auth/callback';

/**
 * Supabase OAuth 콜백 URL → Session 변환.
 *
 * 두 가지 flow 모두 처리:
 * - PKCE flow: `reason://auth/callback?code=...` → exchangeCodeForSession
 * - Implicit flow: `reason://auth/callback#access_token=...&refresh_token=...` → setSession
 *
 * Supabase Dashboard에서 어느 flow를 쓰든 클라이언트가 적응. 기본은 implicit이고
 * 토큰이 hash fragment에 박혀와서 `Linking.parse`의 queryParams로는 안 잡힘 — 직접 파싱.
 */
async function resolveCallbackUrl(url: string, label: string): Promise<Session | null> {
  const parsed = Linking.parse(url);
  console.log(`[auth] ${label} parsed:`, JSON.stringify({
    scheme: parsed.scheme, hostname: parsed.hostname, path: parsed.path,
    queryParams: parsed.queryParams,
  }));

  // queryParams의 error_code 우선 처리 (호출자가 분기)
  const errorCode = parsed.queryParams?.error_code as string | undefined;
  if (errorCode) {
    const desc = parsed.queryParams?.error_description as string | undefined;
    throw new Error(`OAuth_ERROR:${errorCode}:${desc ?? ''}`);
  }

  // 1. queryParams의 code (PKCE)
  const code = (parsed.queryParams?.code as string | undefined) ?? null;
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return data.session;
  }

  // 2. fragment의 access_token + refresh_token (implicit)
  if (url.includes('#')) {
    const fragment = url.split('#')[1] ?? '';
    const fragParams = new URLSearchParams(fragment);

    // fragment에 error가 있을 수도
    const fragErrCode = fragParams.get('error_code');
    if (fragErrCode) {
      const fragErrDesc = fragParams.get('error_description');
      throw new Error(`OAuth_ERROR:${fragErrCode}:${fragErrDesc ?? ''}`);
    }

    const accessToken = fragParams.get('access_token');
    const refreshToken = fragParams.get('refresh_token');
    if (accessToken && refreshToken) {
      console.log(`[auth] ${label} implicit flow — setSession`);
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw error;
      return data.session;
    }
  }

  return null;
}

/**
 * expo-web-browser는 OAuth 브라우저 세션에 필수.
 * 미설치 환경(예: 패키지 install 전)에서도 빌드가 깨지지 않도록 동적 require로 우회.
 *
 * 실제 expo-web-browser의 WebBrowserAuthSessionResult: 'success'(+url) | 'cancel' | 'dismiss' | 'locked'.
 */
type WebBrowserResult =
  | { type: 'success'; url: string }
  | { type: 'cancel' }
  | { type: 'dismiss' }
  | { type: 'locked' };

interface WebBrowserModule {
  openAuthSessionAsync: (url: string, redirectUrl: string) => Promise<WebBrowserResult>;
}

function getWebBrowser(): WebBrowserModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-web-browser') as WebBrowserModule;
  } catch {
    return null;
  }
}

/**
 * OAuth 로그인 — 익명 세션 위에서 provider 연결.
 *
 * 핵심: `linkIdentity`는 *현재 세션*에 OAuth identity를 추가하므로 user.id가 유지된다.
 * 그래서 익명 가입으로 쌓인 일기/응답 데이터가 OAuth 가입 후에도 그대로 보존된다.
 * (signInWithOAuth는 새 user를 만들어 데이터 단절이 생긴다)
 *
 * 흐름:
 * 1. 현재 세션 확보 (없으면 익명 가입)
 * 2. linkIdentity로 provider 인증 URL 발급
 * 3. 시스템 브라우저로 URL 열기
 * 4. 사용자 인증 완료 → reason://auth/callback?code=... deep link
 * 5. exchangeCodeForSession (PKCE) — 세션은 동일 user.id 유지
 * 6. users.provider/provider_user_id update (다른 컬럼은 건드리지 않음)
 *
 * 한국 한정 출시:
 * - Apple은 iOS에서만 노출
 * - Kakao는 Supabase Dashboard에서 OpenID Connect 활성화 필요
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<{ session: import('@supabase/supabase-js').Session | null }> {
  if (provider === 'apple' && Platform.OS !== 'ios') {
    throw new Error('Apple 로그인은 iOS에서만 사용할 수 있어');
  }

  const WebBrowser = getWebBrowser();
  if (!WebBrowser) {
    throw new Error(
      'expo-web-browser 패키지가 필요해. 터미널에서 `npx expo install expo-web-browser`를 실행해줘.',
    );
  }

  // 현재 세션 확보 — useAuth가 마운트 시 1회만 익명 가입을 발사하므로
  // 계정 영구 삭제(doDelete) → signOut 후 같은 세션에서 재로그인 시도 시 session 부재.
  // session 없으면 *지금* 익명 가입 후 그 위에 linkIdentity 진행 — 데이터 단절 회피.
  let preSession = (await supabase.auth.getSession()).data.session;
  if (!preSession) {
    const { data: anon, error: anonError } = await supabase.auth.signInAnonymously();
    if (anonError || !anon.session) {
      throw new Error('계정이 준비되지 않았어. 잠시 후 다시 시도해줘');
    }
    preSession = anon.session;
  }
  const oldUserId = preSession.user.id;

  // 보존할 데이터가 있는지 확인 — 없으면 linkIdentity를 건너뛰고 signInWithOAuth 직행.
  // 이유: 재가입 사용자(refresh token 무효화 후 새 익명 user_id)가 linkIdentity로 가면
  // 이미 다른 user에 같은 OAuth identity가 링크돼 있어 identity_already_exists로 폴백 →
  // 브라우저가 두 번 열리며 iOS 프롬프트가 두 번 뜨는 UX 버그가 생긴다.
  // breakup_date가 있으면 온보딩을 마친 사용자이므로 linkIdentity로 데이터 보존을 시도.
  const { data: userRow } = await supabase
    .from('users')
    .select('breakup_date')
    .eq('id', oldUserId)
    .maybeSingle();
  const hasDataToPreserve = !!userRow?.breakup_date;

  if (!hasDataToPreserve) {
    console.log('[auth] no anon data to preserve — using signInWithOAuth (single prompt)');
    await supabase.auth.signOut();
    const { data: directData, error: directErr } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true },
    });
    if (directErr) throw directErr;
    if (!directData?.url) throw new Error('OAuth URL을 받지 못했어');

    const directResult = await WebBrowser.openAuthSessionAsync(directData.url, REDIRECT_URL);
    if (directResult.type !== 'success') {
      if (directResult.type === 'cancel' || directResult.type === 'dismiss') {
        throw new Error('로그인을 취소했어');
      }
      throw new Error('로그인에 실패했어');
    }
    const directSession = await resolveCallbackUrl(directResult.url, 'direct');
    if (!directSession) throw new Error('세션을 받지 못했어');

    // 신규 OAuth 사용자라면 users 행이 아직 없을 수 있음 — 보장 차원에서 upsert
    const directMeta = directSession.user.user_metadata as { sub?: string; provider_id?: string } | undefined;
    const directProviderUserId = directMeta?.sub ?? directMeta?.provider_id ?? null;
    const { error: directUpdateError } = await supabase
      .from('users')
      .update({ provider, provider_user_id: directProviderUserId })
      .eq('id', directSession.user.id);
    if (directUpdateError) console.warn('[auth] provider update failed (direct):', directUpdateError.message);

    return { session: directSession };
  }

  // 익명 세션 위에서 provider 연결 — 데이터 보존을 위해 linkIdentity 사용
  const { data, error } = await supabase.auth.linkIdentity({
    provider,
    options: {
      redirectTo: REDIRECT_URL,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('OAuth URL을 받지 못했어');

  console.log('[auth] OAuth start:', { provider, authUrl: data.url, redirectUrl: REDIRECT_URL });
  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
  console.log('[auth] WebBrowser result type:', result.type);
  if (result.type !== 'success') {
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('로그인을 취소했어');
    }
    throw new Error('로그인에 실패했어');
  }

  let session: Session | null = null;
  try {
    session = await resolveCallbackUrl(result.url, 'primary');
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    // identity_already_exists: 이미 같은 OAuth identity가 *다른 user*에 link됨 (보통 이전 익명 세션 잔존).
    // 익명 세션을 버리고 *기존 user로 직접 로그인* (signInWithOAuth fallback).
    // 익명 세션의 데이터는 손실되나, 사용자는 이미 가입된 본인 계정으로 진입 가능.
    if (msg.startsWith('OAuth_ERROR:identity_already_exists')) {
      console.log('[auth] identity already linked — falling back to signInWithOAuth');
      await supabase.auth.signOut();
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true },
      });
      if (signInErr) throw signInErr;
      if (!signInData?.url) throw new Error('OAuth URL을 받지 못했어 (재시도)');

      const retry = await WebBrowser.openAuthSessionAsync(signInData.url, REDIRECT_URL);
      console.log('[auth] retry WebBrowser result type:', retry.type);
      if (retry.type !== 'success') throw new Error('로그인에 실패했어 (재시도)');
      session = await resolveCallbackUrl(retry.url, 'retry');
      if (!session) throw new Error('세션을 받지 못했어 (재시도)');
      return { session };
    }
    // 다른 에러는 사용자에게 그대로 노출
    if (msg.startsWith('OAuth_ERROR:')) {
      const parts = msg.split(':');
      throw new Error(`로그인 실패 (${parts[1] ?? 'unknown'})`);
    }
    throw e;
  }

  if (!session) throw new Error('세션을 받지 못했어');

  // user.id가 유지됐는지 확인 (linkIdentity가 정상 동작했는지 sanity check)
  if (session.user.id !== oldUserId) {
    console.warn('[auth] user.id changed after linkIdentity — data may be orphaned', {
      oldUserId,
      newUserId: session.user.id,
    });
  }

  // users.provider/provider_user_id만 update — 다른 컬럼(breakup_date·consent 등) 보존
  const meta = session.user.user_metadata as { sub?: string; provider_id?: string } | undefined;
  const providerUserId = meta?.sub ?? meta?.provider_id ?? null;
  const { error: updateError } = await supabase
    .from('users')
    .update({ provider, provider_user_id: providerUserId })
    .eq('id', session.user.id);
  if (updateError) console.warn('[auth] provider update failed:', updateError.message);

  return { session };
}

/**
 * 사용자가 OAuth 미사용·익명 진행을 원할 때.
 * **한국 한정 출시 정책상 운영에서는 비활성**. 개발/테스트에서만 사용.
 */
export async function continueAsAnonymous(): Promise<void> {
  // 이미 익명 세션이 있을 가능성 높음. 없으면 useAuth가 처리.
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
}
