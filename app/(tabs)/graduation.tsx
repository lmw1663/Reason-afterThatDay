import { Redirect } from 'expo-router';

/**
 * 졸업 탭 진입 가드 — A-4
 *
 * 본 화면 자체는 _layout.tsx에서 href: null로 탭바에서 숨겨졌지만,
 * URL 직접 진입(deep link, 잔존 router.push)을 차단하기 위해 paused 화면으로 redirect.
 *
 * 원본 졸업 탭 UI는 git 이력에 보존됨. 보류 해제 시 복원.
 */
export default function GraduationTabScreen() {
  return <Redirect href="/graduation-paused" />;
}
