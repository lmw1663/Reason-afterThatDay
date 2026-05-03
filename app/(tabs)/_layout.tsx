import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';

/**
 * 하단 탭 — A-3
 *
 * 4탭 [홈/관계분석/나침반/졸업] → 3탭 [오늘/기록/나]로 재구성.
 *
 * 이유:
 *  - 기존 구조는 사용자가 임의의 도구에 *언제든* 진입 → 페르소나·D+N 임상 안전 게이트와 충돌
 *  - 분석·나침반·졸업은 모든 페르소나에 적합한 도구가 아님 (매트릭스 §2 C4·C6·C9 참조)
 *  - 새 구조: 도구가 아닌 *영역* 분리. 분석·나침반은 [나] 안 카드로 진입(A-5)
 *
 * 졸업 탭(graduation)은 본 단계에서 제거 — A-4 후속 작업으로 진입 경로 전체 비활성화.
 */
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.purple[400],
        tabBarInactiveTintColor: colors.gray[600],
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index"   options={{ title: '오늘', tabBarIcon: ({ color }) => <TabIcon name="home"    color={color} /> }} />
      <Tabs.Screen name="records" options={{ title: '기록', tabBarIcon: ({ color }) => <TabIcon name="book"    color={color} /> }} />
      <Tabs.Screen name="me"      options={{ title: '나',   tabBarIcon: ({ color }) => <TabIcon name="smile"   color={color} /> }} />

      {/* 기존 탭 — 탭바에서 숨김, URL은 A-4·A-5에서 정리. */}
      <Tabs.Screen name="analysis"   options={{ href: null }} />
      <Tabs.Screen name="compass"    options={{ href: null }} />
      <Tabs.Screen name="graduation" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} color={color} size={22} strokeWidth={1.8} />;
}
