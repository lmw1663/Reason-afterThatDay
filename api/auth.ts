import { Platform } from 'react-native';
import { supabase } from './supabase';
import * as Linking from 'expo-linking';

export type OAuthProvider = 'google' | 'apple' | 'kakao';

const REDIRECT_URL = 'reason://auth/callback';

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

  // 현재 세션 확보 — useAuth가 익명 가입을 자동으로 했어야 함
  const { data: pre } = await supabase.auth.getSession();
  if (!pre.session) {
    throw new Error('계정이 준비되지 않았어. 잠시 후 다시 시도해줘');
  }
  const oldUserId = pre.session.user.id;

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

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
  if (result.type !== 'success') {
    if (result.type === 'cancel' || result.type === 'dismiss') {
      throw new Error('로그인을 취소했어');
    }
    throw new Error('로그인에 실패했어');
  }

  // URL에서 code 추출 (PKCE)
  const parsed = Linking.parse(result.url);
  const code = (parsed.queryParams?.code as string | undefined) ?? null;
  if (!code) throw new Error('인증 코드를 받지 못했어');

  const { data: exchanged, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) throw exchangeError;

  // user.id가 유지됐는지 확인 (linkIdentity가 정상 동작했는지 sanity check)
  if (exchanged.session?.user.id && exchanged.session.user.id !== oldUserId) {
    console.warn('[auth] user.id changed after linkIdentity — data may be orphaned', {
      oldUserId,
      newUserId: exchanged.session.user.id,
    });
  }

  // users.provider/provider_user_id만 update — 다른 컬럼(breakup_date·consent 등) 보존
  if (exchanged.session?.user.id) {
    const meta = exchanged.session.user.user_metadata as { sub?: string; provider_id?: string } | undefined;
    const providerUserId = meta?.sub ?? meta?.provider_id ?? null;
    const { error: updateError } = await supabase
      .from('users')
      .update({ provider, provider_user_id: providerUserId })
      .eq('id', exchanged.session.user.id);
    if (updateError) console.warn('[auth] provider update failed:', updateError.message);
  }

  return { session: exchanged.session };
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
