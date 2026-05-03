import { supabase } from './supabase';

// X-1-잔여 §37 처리정지권 — PIPA 제37조 대응.
// users 테이블의 notifications_suspended·ai_analysis_suspended 토글 조회/갱신.
//
// 본 모듈은 *사용자 의사 표현*만 저장. 실제 처리 정지(알림 발송 차단·AI 호출 차단)는
// 호출처(notification cron·api/ai)에서 isProcessingSuspended 검사 후 게이트 — 별도 적용 PR.
//
// 위기 응답(C-SSRS·EmotionalCheckModal)은 안전 보호라 본 토글과 무관 — 호출처에서 별도 정책.

export interface ProcessingSuspension {
  notificationsSuspended: boolean;
  aiAnalysisSuspended: boolean;
  updatedAt: string | null;
}

const DEFAULT: ProcessingSuspension = {
  notificationsSuspended: false,
  aiAnalysisSuspended: false,
  updatedAt: null,
};

export async function getProcessingSuspension(userId: string): Promise<ProcessingSuspension> {
  const { data, error } = await supabase
    .from('users')
    .select('notifications_suspended, ai_analysis_suspended, suspension_updated_at')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return DEFAULT;
  return {
    notificationsSuspended: data.notifications_suspended ?? false,
    aiAnalysisSuspended: data.ai_analysis_suspended ?? false,
    updatedAt: data.suspension_updated_at ?? null,
  };
}

export async function updateProcessingSuspension(
  userId: string,
  patch: Partial<Pick<ProcessingSuspension, 'notificationsSuspended' | 'aiAnalysisSuspended'>>,
): Promise<void> {
  // 빈 patch 시 early return — timestamp만 갱신되는 의미 없는 update 방지 (opus 권고)
  if (patch.notificationsSuspended === undefined && patch.aiAnalysisSuspended === undefined) {
    return;
  }
  const update: Record<string, unknown> = { suspension_updated_at: new Date().toISOString() };
  if (patch.notificationsSuspended !== undefined) {
    update.notifications_suspended = patch.notificationsSuspended;
  }
  if (patch.aiAnalysisSuspended !== undefined) {
    update.ai_analysis_suspended = patch.aiAnalysisSuspended;
  }
  const { error } = await supabase.from('users').update(update).eq('id', userId);
  if (error) throw error;
}
