import { Text, View, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CoolingTimer } from '@/components/ui/CoolingTimer';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Caption, Heading } from '@/components/ui/Typography';
import { BackHeader } from '@/components/ui/BackHeader';
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
        <BackHeader label="홈" onPress={() => router.replace('/(tabs)')} />
        <Caption className="mb-2">유예 기간</Caption>
        <Heading className="mb-6">마음을 다시 들여다봐</Heading>

        {/* D-N 카운트다운 — CoolingTimer가 자체 패딩을 가져 Card default(p-4) 대신 직접 surface 배경 적용 */}
        <View className="bg-surface rounded-2xl mb-6">
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
            <Caption className="mb-3">체크인 기록</Caption>
            {(checkinResponses as { text: string; date: string }[]).map((r, i) => (
              <Card key={i} className="p-3 mb-2 rounded-xl">
                <Caption variant="subtle" className="mb-1">{r.date}</Caption>
                <Text className="text-white text-sm">{r.text}</Text>
              </Card>
            ))}
          </View>
        )}

        {isDay7 && (
          <Card variant="subtle" accent="teal" className="mb-4">
            <Text className="text-teal-400 text-sm text-center font-semibold">
              오늘이 Day 7이야. 최종 확인을 할 수 있어.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="자율 체크인 하기" onPress={() => router.push('/cooling/checkin')} />
        {isDay7 && (
          <PrimaryButton leftIcon="graduation" label="최종 졸업 확인" onPress={() => router.push('/cooling/final')} />
        )}
        <PrimaryButton label="취소할게" variant="ghost" onPress={handleCancel} />
      </View>
    </ScreenWrapper>
  );
}
