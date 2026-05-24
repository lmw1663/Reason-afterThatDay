import { Tabs } from 'expo-router';
import { TabBar } from '@/components/layout/TabBar';
import { useKnotStore } from '@/store/useKnotStore';

/**
 * 하단 탭 — A-3 + F-4
 *
 * 4탭 [홈/관계분석/나침반/졸업] → 3탭 [오늘/기록/나]로 재구성.
 *
 * 이유:
 *  - 기존 구조는 사용자가 임의의 도구에 *언제든* 진입 → 페르소나·D+N 임상 안전 게이트와 충돌
 *  - 분석·나침반·졸업은 모든 페르소나에 적합한 도구가 아님 (매트릭스 §2 C4·C6·C9 참조)
 *  - 새 구조: 도구가 아닌 *영역* 분리. 분석·나침반은 [나] 안 카드로 진입(A-5)
 *
 * F-4 매듭 탭(knot)은 *동적 노출* — useKnotStore.knotTabVisible이 true일 때만 제일
 * 오른쪽에 추가. 권유 모달 승낙(recordAccept) 시 true, 매듭 완료 시 hideKnotTab() 호출.
 *
 * 탭바 UI: 커스텀 `<TabBar>` (floating capsule + spring). 아이콘·노출 SSOT는
 * `components/layout/TabBar.tsx` — 매듭 탭의 *탭바 노출*도 거기서 knotTabVisible로 제어.
 * 여기 `href: null`은 탭바가 아니라 *직접 내비게이션/딥링크* 차단용으로 유지
 * (knot 비노출 시 /knot 라우트를 링크 불가 상태로 게이팅).
 */
export default function TabLayout() {
  const knotTabVisible = useKnotStore((s) => s.knotTabVisible);

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      // 탭 전환 슬라이드는 각 탭 화면의 ScreenWrapper entrance="slide"가 담당.
      // (bottom-tabs animation:'shift'는 가장자리 탭이 빈 화면으로 남는 문제가 있어 미사용)
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="records" />
      <Tabs.Screen name="me" />

      {/* F-4 매듭 탭 — 권유 모달 승낙 시에만 동적 노출. 가장 오른쪽 위치. */}
      <Tabs.Screen name="knot" options={{ href: knotTabVisible ? '/knot' : null }} />

      {/* 기존 탭 — 탭바에서 숨김, URL은 A-4·A-5에서 정리. */}
      <Tabs.Screen name="analysis"   options={{ href: null }} />
      <Tabs.Screen name="compass"    options={{ href: null }} />
      <Tabs.Screen name="graduation" options={{ href: null }} />
    </Tabs>
  );
}
