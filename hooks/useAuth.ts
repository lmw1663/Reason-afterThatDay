import { useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { parseDateStr } from '@/utils/dateUtils';

export function useAuth() {
  const { setUserId, setBreakupDate, setOnboardingCompleted } = useUserStore();

  useEffect(() => {
    // 세션이 없으면 익명 가입을 자동 수행한다.
    // 익명 가입이 되어 있어야 일기/분석/나침반 등 모든 DB write가 동작한다.
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setUserId(data.session.user.id);
        loadUserProfile(data.session.user.id);
        return;
      }

      const { data: anon, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.warn('[auth] anonymous sign-in failed:', error.message);
        return;
      }
      if (anon.session) {
        setUserId(anon.session.user.id);
        loadUserProfile(anon.session.user.id);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUserId(session.user.id);
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(userId: string) {
    const { data } = await supabase
      .from('users')
      .select('breakup_date, onboarding_completed')
      .eq('id', userId)
      .single();

    if (data) {
      setBreakupDate(parseDateStr(data.breakup_date));
      setOnboardingCompleted(data.onboarding_completed);
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

  async function linkGoogleAccount() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'reason://auth/callback' },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    await supabase.auth.signOut();
    useUserStore.getState().reset();
  }

  return { signInAnonymously, getOrCreateSession, linkGoogleAccount, signOut };
}
