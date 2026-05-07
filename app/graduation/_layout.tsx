import { Redirect, Stack } from 'expo-router';
import { useKnotStore } from '@/store/useKnotStore';

/**
 * 매듭 트랙 진입 가드 — A-4 + F-12
 *
 * Phase F 매듭 트랙은 *권유 모달 승낙* 흐름으로만 진입 허용:
 *   useKnotStore.knotTabVisible === true 일 때만 graduation 5단계(report·letter·confirm·
 *   ritual·farewell·request) Stack 진입.
 *
 * 그 외(딥링크 직접 접근·매듭 트랙 미진입 사용자)는 /graduation-paused로 redirect.
 * F-13에서 A-4 공식 해제 + CLAUDE.md 갱신 시까지 본 가드 유지 — 매듭 진입의 임상 안전 게이트.
 */
export default function GraduationLayout() {
  const knotTabVisible = useKnotStore((s) => s.knotTabVisible);
  if (!knotTabVisible) {
    return <Redirect href="/graduation-paused" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
