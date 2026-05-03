import { Redirect } from 'expo-router';

/**
 * 나침반 탭 진입 가드 — A-5
 *
 * 나침반은 [나] 안에서 "오늘의 방향" 카드로 진입한다.
 * 탭은 이미 (tabs)/_layout.tsx에서 href: null로 숨겨졌고, URL 직접 진입도 [나]로 우회.
 * 본 탭의 원본 UI는 git history에 보존됨.
 */
export default function CompassTabScreen() {
  return <Redirect href="/(tabs)/me" />;
}
