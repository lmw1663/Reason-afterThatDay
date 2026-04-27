import { useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { requestGraduation } from '@/api/graduation';
import { AppError } from '@/constants/errors';

export default function GraduationRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { userId } = useUserStore();
  const { setCooling, status } = useCoolingStore();

  // 이미 유예 중이면 진입 불가
  if (status === 'cooling') {
    router.replace('/cooling');
    return null;
  }

  async function handleRequest() {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const row = await requestGraduation(userId);
      setCooling({
        id: row.id,
        status: row.status,
        requestedAt: row.requestedAt,
        coolingEndsAt: row.coolingEndsAt,
        checkinResponses: row.checkinResponses,
        notificationsSent: row.notificationsSent,
      });
      router.replace('/cooling');
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === AppError.COOLING_ACTIVE) {
        setError('이미 유예 기간이 진행 중이야.');
      } else {
        setError('신청 중 오류가 생겼어. 다시 시도해줄래?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">졸업 · 4 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">졸업 신청</Text>

        <View className="rounded-2xl p-5 mb-6" style={{ backgroundColor: '#1A1A22' }}>
          <Text className="text-white font-semibold text-base mb-3">📋 유예 기간 안내</Text>
          <View className="gap-3">
            <InfoRow emoji="⏳" text="졸업 신청 후 7일간 유예 기간이 시작돼." />
            <InfoRow emoji="🔕" text="유예 기간 중 일반 알림은 모두 중지돼." />
            <InfoRow emoji="🔔" text="Day 7에 최종 확인 알림 1회만 발송돼." />
            <InfoRow emoji="↩️" text="마음이 바뀌면 언제든 취소할 수 있어." />
            <InfoRow emoji="💾" text="체크인 기록은 취소해도 보존돼." />
          </View>
        </View>

        <View className="rounded-xl px-4 py-3 mb-6" style={{ backgroundColor: 'rgba(83,74,183,0.1)', borderWidth: 1, borderColor: '#534AB7' }}>
          <Text className="text-purple-400 text-sm text-center leading-relaxed">
            졸업은 끝이 아니야.{'\n'}이 시간을 통해 성장한 너의 새로운 시작이야.
          </Text>
        </View>

        {error ? (
          <Text className="text-coral-400 text-sm text-center mb-4">{error}</Text>
        ) : null}
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={loading ? '신청 중...' : '7일 유예 시작하기'}
          onPress={handleRequest}
          loading={loading}
        />
        <PrimaryButton
          label="아직 아니야"
          variant="ghost"
          onPress={() => router.back()}
        />
      </View>
    </ScreenWrapper>
  );
}

function InfoRow({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <Text>{emoji}</Text>
      <Text className="text-gray-400 text-sm flex-1 leading-relaxed">{text}</Text>
    </View>
  );
}
