import { useEffect } from 'react';
import { supabase } from '@/api/supabase';
import { useUserStore } from '@/store/useUserStore';
import type { PsychAxes } from '@/utils/personaClassifier';

/**
 * 페르소나 axes 변화 감지 — C-1-4 (클라이언트 보조)
 *
 * 서버 cron(`persona-reclassify-cron`)이 D+7/14/30/60/90에 axes 시계열 갱신.
 * 본 hook은 앱 진입 시 *axes 변화를 감지*해 디버그 로그만 남긴다.
 *
 * **의도적으로 자동 재분류를 하지 않는다** — 정확한 재분류는 onboarding 응답 재사용이 필요하나,
 * 응답이 보존되지 않은 현 상태(`onboarding_responses` 테이블 미존재)에서 reclassifyPersona를
 * 호출하면 P12 baseline으로 잘못 fallback될 위험. Phase D에서 응답 보존 인프라 추가 후 활성화.
 *
 * 통합: app/_layout.tsx의 AppBootstrap에서 호출. 사용자 안내 X (라벨 비노출).
 */
export function usePersonaReclassify() {
  const { userId } = useUserStore();

  useEffect(() => {
    if (!userId) return;
    void detectAxesDrift(userId);
  }, [userId]);
}

async function detectAxesDrift(userId: string): Promise<void> {
  try {
    const { data: latestAxes } = await supabase
      .from('psych_profile_axes')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latestAxes) return;

    const { data: active } = await supabase
      .from('personas')
      .select('axes_snapshot')
      .eq('user_id', userId)
      .eq('active', true)
      .maybeSingle();

    if (!active) return;

    const snapshot = active.axes_snapshot as PsychAxes;
    const updated = {
      a1: latestAxes.a1_attachment,
      a7: latestAxes.a7_dominant_emotion,
      a8: latestAxes.a8_crisis,
    };
    const drift =
      snapshot.a1_attachment !== updated.a1 ||
      snapshot.a7_dominant_emotion !== updated.a7 ||
      snapshot.a8_crisis !== updated.a8;

    if (drift) {
      // TODO Phase D: onboarding_responses 보존 후 본 위치에서 reclassifyPersona 호출.
      // 현재는 axes 변화 로그만 — 다음 사용자 능동 진입(settings의 "내 모드 다시 평가") 시 재분류.
      console.log('[reclassify] axes drift detected', { userId, snapshot, updated });
    }
  } catch (e) {
    console.warn('[reclassify] axes drift detection failed:', e);
  }
}
