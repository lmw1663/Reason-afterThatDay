import { useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import { parseDateStr } from '@/utils/dateUtils';

export function useAuth() {
  const { setUserId, setBreakupDate, setOnboardingCompleted } = useUserStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      setUserId(session.user.id);
      loadUserProfile(session.user.id);
    });

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

  return { signInAnonymously, linkGoogleAccount, signOut };
}
