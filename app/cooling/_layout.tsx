import { Stack } from 'expo-router';
import { colors } from '@/constants/colors';

export default function CoolingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
