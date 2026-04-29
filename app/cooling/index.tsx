import { Text, View, ScrollView, Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CoolingTimer } from '@/components/ui/CoolingTimer';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useUserStore } from '@/store/useUserStore';
import { cancelCooling } from '@/api/graduation';

export default function CoolingDashboardScreen() {
  const { id, coolingEndsAt, status, checkinResponses, updateStatus } = useCoolingStore();
  const { userId } = useUserStore();

  const isDay7 = coolingEndsAt
    ? new Date(coolingEndsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  async function handleCancel() {
    Alert.alert(
      '졸업 신청 취소',
      '취소하면 유예 기간이 종료돼. 체크인 기록은 보존돼. 계속할게?',
      [
        { text: '아니야', style: 'cancel' },
        {
          text: '취소할게',
          style: 'destructive',
          onPress: async () => {
            if (!id || !userId) return;
            await cancelCooling(id);
            updateStatus('cancelled');
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }

  if (!coolingEndsAt || status !== 'cooling') {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.replace('/(tabs)')} className="mb-4" style={{ alignSelf: 'flex-start' }}>
          <Text className="text-gray-400 text-base">← 홈</Text>
        </Pressable>
        <Text className="text-gray-400 text-sm mb-2">유예 기간</Text>
        <Text className="text-white text-2xl font-bold mb-6">마음을 다시 들여다봐</Text>

        {/* D-N 카운트다운 */}
        <View className="rounded-2xl mb-6" style={{ backgroundColor: '#1A1A22' }}>
          <CoolingTimer coolingEndsAt={coolingEndsAt} />
        </View>

        {/* 안내 */}
        <InsightCard
          tag="유예 기간 중"
          body="일반 알림은 모두 중지돼 있어. 오롯이 마음을 정리하는 시간이야. Day 7에 최종 확인 알림이 올 거야."
          accent="teal"
        />

        <View className="mt-4 mb-6" />

        {/* 자율 체크인 기록 */}
        {(checkinResponses as unknown[]).length > 0 && (
          <View className="mb-6">
            <Text className="text-gray-400 text-sm mb-3">체크인 기록</Text>
            {(checkinResponses as { text: string; date: string }[]).map((r, i) => (
              <View
                key={i}
                className="p-3 rounded-xl mb-2"
                style={{ backgroundColor: '#1A1A22' }}
              >
                <Text className="text-gray-400 text-xs mb-1">{r.date}</Text>
                <Text className="text-white text-sm">{r.text}</Text>
              </View>
            ))}
          </View>
        )}

        {isDay7 && (
          <View
            className="rounded-xl px-4 py-3 mb-4"
            style={{ backgroundColor: 'rgba(29,158,117,0.1)', borderWidth: 1, borderColor: '#1D9E75' }}
          >
            <Text className="text-teal-400 text-sm text-center font-semibold">
              오늘이 Day 7이야. 최종 확인을 할 수 있어.
            </Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="자율 체크인 하기" onPress={() => router.push('/cooling/checkin')} />
        {isDay7 && (
          <PrimaryButton label="🎓 최종 졸업 확인" onPress={() => router.push('/cooling/final')} />
        )}
        <PrimaryButton label="취소할게" variant="ghost" onPress={handleCancel} />
      </View>
    </ScreenWrapper>
  );
}
