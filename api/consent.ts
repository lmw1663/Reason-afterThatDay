import { supabase } from './supabase';
import { buildConsentPayload, isConsentValid, type ConsentKey } from '@/constants/consent';

export type ConsentVersionMap = Partial<Record<ConsentKey, string>>;

/**
 * 사용자의 현재 동의 상태 조회.
 * 미가입(userId 없음) 또는 미동의 시 null 반환.
 */
export async function fetchConsentVersions(userId: string): Promise<ConsentVersionMap | null> {
  const { data, error } = await supabase
    .from('users')
    .select('consent_versions, consent_accepted_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('[consent] fetch failed:', error.message);
    return null;
  }
  if (!data) return null;
  return (data.consent_versions ?? null) as ConsentVersionMap | null;
}

/**
 * 모든 필수 약관에 대해 현재 버전으로 동의를 기록.
 * 화면(consent.tsx) "동의하고 시작" 버튼에서 호출.
 */
export async function acceptAllConsents(userId: string): Promise<{
  versions: ConsentVersionMap;
  acceptedAt: string;
}> {
  const versions = buildConsentPayload();
  const acceptedAt = new Date().toISOString();

  const { error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      consent_versions: versions,
      consent_accepted_at: acceptedAt,
    });

  if (error) throw error;
  return { versions, acceptedAt };
}

/**
 * 현재 저장된 동의 버전이 최신 CONSENT_ITEMS와 일치하는지 확인.
 * 약관 갱신 시 재동의 트리거에 사용.
 */
export function consentNeedsRefresh(versions: ConsentVersionMap | null): boolean {
  return !isConsentValid(versions ?? null);
}
