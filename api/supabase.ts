import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 무효 refresh token 정리 — AsyncStorage에 남은 만료/폐기 세션을 부팅 시 1회 청소.
// getSession()은 throw 대신 { data, error }를 리턴하므로 .catch()로는 못 잡는다.
// 또한 백그라운드 auto-refresh 타이머 실패는 unhandled rejection으로 새는데,
// 그 경로 모두를 신호로 받아 stale 세션을 명시적으로 비운다 — useAuth가 후속에서 익명 재가입.
(async () => {
  const { error } = await supabase.auth.getSession();
  if (error && /Refresh Token|JWT|expired/i.test(error.message)) {
    await supabase.auth.signOut().catch(() => {});
  }
})();

supabase.auth.onAuthStateChange((event) => {
  // TOKEN_REFRESHED 실패 → SIGNED_OUT 으로 떨어짐. 별도 처리는 useAuth가 담당.
  // 여기선 로그만 남겨 진단을 돕는다.
  if (event === 'SIGNED_OUT') {
    console.log('[supabase] SIGNED_OUT (token refresh failure or explicit sign-out)');
  }
});
