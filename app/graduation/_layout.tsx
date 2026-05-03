import { Redirect } from 'expo-router';

/**
 * 졸업 트랙 보류 — A-4
 *
 * 모든 /graduation/* 라우트를 /graduation-paused로 redirect한다.
 * 기존 화면 파일들(report.tsx, letter.tsx 등)은 코드로 남아있지만 진입 자체가 차단된다.
 * 보류 해제 시: 본 _layout을 원래 Stack 구조로 되돌리고 화면들을 다시 활성화.
 */
export default function GraduationLayout() {
  return <Redirect href="/graduation-paused" />;
}
