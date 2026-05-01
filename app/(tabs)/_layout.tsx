import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';
import { Icon, type IconName } from '@/components/ui/Icon';

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
      <Tabs.Screen name="index"      options={{ title: '홈',     tabBarIcon: ({ color }) => <TabIcon name="home"       color={color} /> }} />
      <Tabs.Screen name="analysis"   options={{ title: '관계분석', tabBarIcon: ({ color }) => <TabIcon name="search"     color={color} /> }} />
      <Tabs.Screen name="compass"    options={{ title: '나침반',   tabBarIcon: ({ color }) => <TabIcon name="compass"    color={color} /> }} />
      <Tabs.Screen name="graduation" options={{ title: '졸업',    tabBarIcon: ({ color }) => <TabIcon name="graduation" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: IconName; color: string }) {
  return <Icon name={name} color={color} size={22} strokeWidth={1.8} />;
}
