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
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { requestGraduation } from '@/api/graduation';
import { scheduleRevisits } from '@/api/knotRevisit';
import { AppError } from '@/constants/errors';
import { useKnotPolicy } from '@/hooks/useKnotPolicy';
import { calculateScheduledAt, getRitualsForPersonas } from '@/utils/knotRevisit';
import type { PersonaCode } from '@/utils/personaClassifier';

export default function GraduationRequestScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { userId } = useUserStore();
  const { setCooling, status } = useCoolingStore();
  const { label, coolingDays } = useKnotPolicy();
  const cycleIndex = useRelationshipStore((s) => s.profile.cycleCount);
  const personaPrimary = usePersonaStore((s) => s.primary);
  const personaSecondary = usePersonaStore((s) => s.secondary);

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
        const now = new Date();
        const endsAt = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);
        const personaCodes: string[] = [personaPrimary, personaSecondary].filter(
          (p): p is NonNullable<typeof p> => p !== null,
        );
        const row = await requestGraduation(userId, {
          coolingPeriodDays: coolingDays,
          knotLabel: label,
          personaCodes,
          coolingEndsAt: endsAt.toISOString(),
          cycleIndex,
        });
        setCooling({
          id: row.id,
          status: row.status,
          requestedAt: row.requestedAt,
          coolingEndsAt: row.coolingEndsAt,
          checkinResponses: row.checkinResponses,
          notificationsSent: row.notificationsSent,
          knotLabel: row.knotLabel,
          coolingPeriodDays: row.coolingPeriodDays,
          personaCodes: row.personaCodes,
          cycleIndex: row.cycleIndex,
        });
        // F-9 회상 의식 스케줄 — 매듭 *완료* 시점 기준 D+N 발화. P05·P14·P06 한정.
        const rituals = getRitualsForPersonas(personaCodes as PersonaCode[]);
        if (rituals.length > 0) {
          try {
            await scheduleRevisits({
              userId,
              coolingPeriodId: row.id,
              schedules: rituals.map((r) => ({
                ritualType: r.ritualType,
                scheduledAt: calculateScheduledAt(row.coolingEndsAt, r.daysAfterKnot),
              })),
            });
          } catch (e) {
            console.warn('[knot-revisit] scheduleRevisits failed:', e);
          }
        }
      } else {
        // 로그인 없이 로컬 상태로 유예 시작 — 페르소나별 cooling_days 적용
        const now = new Date();
        const endsAt = new Date(now.getTime() + coolingDays * 24 * 60 * 60 * 1000);
        const personaCodes: string[] = [personaPrimary, personaSecondary].filter(
          (p): p is NonNullable<typeof p> => p !== null,
        );
        setCooling({
          id: `local-${Date.now()}`,
          status: 'cooling',
          requestedAt: now.toISOString(),
          coolingEndsAt: endsAt.toISOString(),
          checkinResponses: [],
          notificationsSent: 0,
          knotLabel: label,
          coolingPeriodDays: coolingDays,
          personaCodes,
          cycleIndex,
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
        <Caption className="mb-2">{label} · 6 / 6</Caption>
        <Heading className="mb-2">{label} 신청</Heading>

        <Card className="p-5 mb-6">
          <View className="flex-row items-center gap-2 mb-3">
            <Icon name="clipboard" size={18} color={colors.gray[50]} />
            <Text className="text-white font-semibold text-base">유예 기간 안내</Text>
          </View>
          <View className="gap-3">
            <InfoRow icon="hourglass" text={`${label} 신청 후 ${coolingDays}일간 유예 기간이 시작돼.`} />
            <InfoRow icon="bell-off"  text="유예 기간 중 일반 알림은 모두 중지돼." />
            <InfoRow icon="bell"      text={`Day ${coolingDays}에 최종 확인 알림 1회만 발송돼.`} />
            <InfoRow icon="undo"      text="마음이 바뀌면 언제든 풀어도 돼." />
            <InfoRow icon="save"      text="체크인 기록은 풀어도 보존돼." />
          </View>
        </Card>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Caption className="text-purple-400 text-center leading-relaxed">
            {label}은 끝이 아니야.{'\n'}언제든 다시 풀어서 새로 시작할 수 있어.
          </Caption>
        </Card>

      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={loading ? '신청 중...' : `${coolingDays}일 유예 시작하기`}
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
