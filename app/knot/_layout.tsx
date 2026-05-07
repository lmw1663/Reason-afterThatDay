import { Redirect, Stack } from 'expo-router';
import { useGraduationLockGuard } from '@/hooks/useGraduationLockGuard';

/**
 * /knot/* 라우트 공통 레이아웃 — F-followup-4
 *
 * 화면 구성:
 *   - prompt.tsx        — 매듭 권유 풀스크린 모달 (홈 trigger 6조건 충족 시)
 *   - cycle-prompt.tsx  — 사이클 가역성 prompt (매듭 완료 후 재진입 시)
 *   - revisit.tsx       — 회상 의식 (P05/P14 D+30/60, P06 D+7)
 *   - archive.tsx       — 매듭 사이클 타임라인 (record 탭에서 진입)
 *
 * **공통 가드**: C-SSRS 양성(`safety_lockouts.graduation_locked = true`) 시 모든
 * /knot/* 라우트를 차단하고 / 로 reroute. 위기 자원·EmotionalCheckModal이 우선.
 *
 *   각 화면도 자체 가드(`canEnterKnotTrack`·`useGraduationLockGuard`)를 가지지만
 *   본 _layout 가드는 *진입점 단일 차단*으로 누수 방지. 가역성 H1(매듭은 끝이 아님)은
 *   *비낙인* 의미이지 *위기 무시*가 아니므로 모든 매듭 화면을 lockout 우선으로 보호.
 *
 * **presentation**: 각 화면이 자기 옵션(`fullScreenModal` 등) 지정 — _layout은 헤더 숨김만.
 */
export default function KnotLayout() {
  const lock = useGraduationLockGuard();

  if (lock === 'locked') {
    return <Redirect href="/" />;
  }

  // loading 동안 child 미렌더 — lock 응답 전 화면 깜빡임 차단
  if (lock === 'loading') {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
