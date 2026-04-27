import { Stack } from 'expo-router';

export default function GraduationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0E0E12' },
        animation: 'slide_from_right',
      }}
    />
  );
}
