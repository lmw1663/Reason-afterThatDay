import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { requestGraduation } from '@/api/graduation';
import { AppError } from '@/constants/errors';

export default function GraduationRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { userId } = useUserStore();
  const { setCooling, status } = useCoolingStore();

  // 이미 유예 중이면 진입 불가
  if (status === 'cooling') {
    router.replace('/cooling');
    return null;
  }

  async function handleRequest() {
    setLoading(true);
    setErrorMsg('');
    try {
      if (userId) {
        const row = await requestGraduation(userId);
        setCooling({
          id: row.id,
          status: row.status,
          requestedAt: row.requestedAt,
          coolingEndsAt: row.coolingEndsAt,
          checkinResponses: row.checkinResponses,
          notificationsSent: row.notificationsSent,
        });
      } else {
        // 로그인 없이 로컬 상태로 유예 시작
        const now = new Date();
        const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        setCooling({
          id: `local-${Date.now()}`,
          status: 'cooling',
          requestedAt: now.toISOString(),
          coolingEndsAt: endsAt.toISOString(),
          checkinResponses: [],
          notificationsSent: 0,
        });
      }
      router.replace('/cooling');
    } catch (e: unknown) {
      const err = e as { code?: string };
      if (err.code === AppError.COOLING_ACTIVE) {
        setErrorMsg('이미 유예 기간이 진행 중이야.');
      } else {
        setErrorMsg('신청 중 오류가 생겼어. 다시 시도해줄래?');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ErrorToast
        visible={!!errorMsg}
        message={errorMsg}
        onHide={() => setErrorMsg('')}
        action={
          errorMsg.includes('오류') ? { label: '재시도', onPress: handleRequest } : undefined
        }
      />
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">졸업 · 5 / 5</Caption>
        <Heading className="mb-2">졸업 신청</Heading>

        <Card className="p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="clipboard" size={18} color={colors.gray[50]} />
            <Text className="text-white font-semibold text-base">유예 기간 안내</Text>
          </View>
          <View className="gap-3">
            <InfoRow icon="hourglass" text="졸업 신청 후 7일간 유예 기간이 시작돼." />
            <InfoRow icon="bell-off"  text="유예 기간 중 일반 알림은 모두 중지돼." />
            <InfoRow icon="bell"      text="Day 7에 최종 확인 알림 1회만 발송돼." />
            <InfoRow icon="undo"      text="마음이 바뀌면 언제든 취소할 수 있어." />
            <InfoRow icon="save"      text="체크인 기록은 취소해도 보존돼." />
          </View>
        </Card>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Caption className="text-purple-400 text-center leading-relaxed">
            졸업은 끝이 아니야.{'\n'}이 시간을 통해 성장한 너의 새로운 시작이야.
          </Caption>
        </Card>

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

function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View className="flex-row items-start gap-3" accessibilityRole="text">
      <View className="mt-0.5">
        <Icon name={icon} size={16} color={colors.gray[400]} />
      </View>
      <Body className="text-gray-400 flex-1">{text}</Body>
    </View>
  );
}
