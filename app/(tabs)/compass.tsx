import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useDecisionStore } from '@/store/useDecisionStore';
import { VERDICT_LABEL, VERDICT_COLOR } from '@/utils/diagnosis';

export default function CompassTabScreen() {
  const { history, latestVerdict } = useDecisionStore();

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">결정 나침반</Text>
        <Text className="text-white text-2xl font-bold mb-6">
          마음의 방향을 탐색해봐
        </Text>

        {latestVerdict && (
          <View
            className="rounded-2xl p-4 mb-6"
            style={{ backgroundColor: '#1A1A22', borderLeftWidth: 4, borderLeftColor: VERDICT_COLOR[latestVerdict] }}
          >
            <Text className="text-gray-400 text-xs mb-1">마지막 결과</Text>
            <Text className="font-semibold text-base" style={{ color: VERDICT_COLOR[latestVerdict] }}>
              {VERDICT_LABEL[latestVerdict]}
            </Text>
          </View>
        )}

        <Text className="text-gray-400 text-sm mb-6 leading-relaxed">
          나침반은 단순히 "잡아" 또는 "놔"를 알려주는 게 아니야.{'\n'}
          지금 네 마음이 어디를 향하는지 함께 들여다보는 거야.
        </Text>

        {history.length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-600 text-xs mb-3">이전 기록</Text>
            {history.slice(0, 3).map((h) => (
              <View
                key={h.id}
                className="flex-row items-center py-3 border-b"
                style={{ borderBottomColor: '#2C2C38' }}
              >
                <View className="flex-1">
                  <Text className="text-white text-sm">{VERDICT_LABEL[h.verdict]}</Text>
                  <Text className="text-gray-600 text-xs mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString('ko-KR')}
                  </Text>
                </View>
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: VERDICT_COLOR[h.verdict] }}
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="나침반 탐색하기"
          onPress={() => router.push('/compass')}
        />
      </View>
    </ScreenWrapper>
  );
}
