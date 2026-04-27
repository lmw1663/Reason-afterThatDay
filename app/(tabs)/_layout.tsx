import { Tabs } from 'expo-router';
import { colors } from '@/constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A22',
          borderTopColor: '#2C2C38',
        },
        tabBarActiveTintColor: colors.purple[400],
        tabBarInactiveTintColor: colors.gray[600],
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index"      options={{ title: '홈'    , tabBarIcon: ({ color }) => <TabIcon emoji="🏠" color={color} /> }} />
      <Tabs.Screen name="analysis"   options={{ title: '관계분석', tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} /> }} />
      <Tabs.Screen name="compass"    options={{ title: '나침반'  , tabBarIcon: ({ color }) => <TabIcon emoji="🧭" color={color} /> }} />
      <Tabs.Screen name="graduation" options={{ title: '졸업'   , tabBarIcon: ({ color }) => <TabIcon emoji="🎓" color={color} /> }} />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, opacity: color === colors.purple[400] ? 1 : 0.5 }}>{emoji}</Text>;
}
