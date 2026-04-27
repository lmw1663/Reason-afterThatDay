import { Text, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useUserStore } from '@/store/useUserStore';

export default function GraduationTabScreen() {
  const { daysElapsed } = useUserStore();
  const canGraduate = daysElapsed >= 30;

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14 items-center justify-center">
        <Text className="text-6xl mb-4">🎓</Text>
        <Text className="text-white text-xl font-bold mb-2 text-center">졸업 트랙</Text>
        {canGraduate ? (
          <Text className="text-gray-400 text-sm text-center leading-relaxed">
            이별 후 {daysElapsed}일이 지났어.{'\n'}
            졸업을 생각해볼 시간이 됐을 수도 있어.{'\n\n'}
            (Phase 4에서 구현 예정)
          </Text>
        ) : (
          <Text className="text-gray-400 text-sm text-center leading-relaxed">
            D+{daysElapsed}일째야.{'\n'}
            지금은 감정을 충분히 느끼고 기록하는 게 먼저야.{'\n\n'}
            (Phase 4에서 구현 예정)
          </Text>
        )}
      </View>
    </ScreenWrapper>
  );
}
