import { Redirect } from 'expo-router';

// 온보딩 완료 여부에 따라 리다이렉트 — 실제 분기는 Phase 1 Auth 이후 구현
export default function Index() {
  return <Redirect href="/onboarding" />;
}
