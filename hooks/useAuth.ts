import { useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { getActivePersona } from '@/api/persona';
import { parseDateStr } from '@/utils/dateUtils';

export function useAuth() {
  const { setUserId, setBreakupDate } = useUserStore();

  useEffect(() => {
    // 동시 익명 가입 폭주 방지 — 부팅 동시에 getSession + SIGNED_OUT 이벤트가 발사될 수 있음.
    let reSignInProgress = false;

    async function ensureAnonymousSession() {
      if (reSignInProgress) return;
      reSignInProgress = true;
      try {
        const { data: anon, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.warn('[auth] anonymous sign-in failed:', error.message);
          return;
        }
        if (anon.session) {
          setUserId(anon.session.user.id);
          loadUserProfile(anon.session.user.id);
        }
      } finally {
        reSignInProgress = false;
      }
    }

    // 세션이 없거나 refresh가 무효면 익명 재가입.
    // 익명 가입이 되어 있어야 일기/분석/나침반 등 모든 DB write가 동작한다.
    (async () => {
      const { data, error } = await supabase.auth.getSession();

      // 무효 refresh token → 명시적으로 비우고 익명 재가입.
      // (이전 OAuth 사용자라면 데이터 단절 위험이 있으나, 무효 토큰 상태에서는 어차피 복구 불가)
      if (error && /Refresh Token|JWT|expired/i.test(error.message)) {
        console.warn('[auth] invalid refresh token — resetting session:', error.message);
        await supabase.auth.signOut().catch(() => {});
        await ensureAnonymousSession();
        return;
      }

      if (data.session) {
        setUserId(data.session.user.id);
        loadUserProfile(data.session.user.id);
        return;
      }

      await ensureAnonymousSession();
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUserId(session.user.id);
        loadUserProfile(session.user.id);
        return;
      }
      // SIGNED_OUT — auto-refresh 실패로도 발사됨. 부팅 직후의 명시적 signOut과 구분 안 되니
      // 익명 재가입으로 복구 (ensureAnonymousSession이 중복 호출 방지 가드 보유).
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        ensureAnonymousSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('breakup_date, onboarding_completed, consent_versions, consent_accepted_at')
      .eq('id', userId)
      .maybeSingle();

    // row 자체가 없으면(미동의 신규 사용자) 아무것도 덮어쓰지 않는다.
    // 동의·온보딩 직후 store에 남아 있는 in-memory 상태가 race로 reset되는 걸 방지.
    if (!data) return;

    if (data.breakup_date) setBreakupDate(parseDateStr(data.breakup_date));
    if (typeof data.onboarding_completed === 'boolean') {
      // DB→store sync 전용 — setter 호출하면 같은 값을 DB에 되쓰는 라운드트립 발생.
      useUserStore.setState({ onboardingCompleted: data.onboarding_completed });
    }
    if (data.consent_versions && data.consent_accepted_at) {
      useUserStore.getState().setConsent(
        data.consent_versions,
        new Date(data.consent_accepted_at),
      );
    }

    // 페르소나 활성 분류 로드 — 분류 안 된 신규 사용자는 null 유지
    try {
      const persona = await getActivePersona(userId);
      usePersonaStore.getState().setPersona(persona);
    } catch (e) {
      console.warn('[auth] persona load failed:', e);
    }
  }

  async function signInAnonymously() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data;
  }

  async function getOrCreateSession() {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (sessionData.session) return sessionData.session;

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
    return data.session;
  }

  async function signOut() {
    await supabase.auth.signOut();
    useUserStore.getState().reset();
  }

  return { signInAnonymously, getOrCreateSession, signOut };
}
