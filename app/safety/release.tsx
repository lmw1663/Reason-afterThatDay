import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { acknowledgeLockout, isAppLocked } from '@/api/safety';

/**
 * 안전 잠금 해제 화면 — B-1
 *
 * C-SSRS urgent/high 양성 후 잠금된 사용자가 *수동으로* 해제하는 흐름.
 * 모달 닫기 등 충동적 해제를 차단하기 위해 별도 화면 + 4문항 안전 확인 통과 + 시간 경과 가드.
 *
 * 잠금 후 24시간 경과 + 안전 확인 4문항 모두 "응" → 해제 가능.
 * 24시간 미경과 또는 한 문항이라도 "아니야" → "조금 더 시간을 갖자" 안내.
 */

const SAFETY_QUESTIONS = [
  '지금 곁에 있어줄 사람이 있어?',
  '안전한 장소에 있어?',
  '오늘 하루 자해·자살 충동이 줄어든 느낌이 들어?',
  '필요할 때 1393에 전화할 수 있겠다는 마음이 들어?',
];

const MIN_LOCKOUT_HOURS = 24;

export default function SafetyReleaseScreen() {
  const { userId } = useUserStore();
  const [answers, setAnswers] = useState<boolean[]>([false, false, false, false]);
  const [touched, setTouched] = useState<boolean[]>([false, false, false, false]);
  const [lockedAt, setLockedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;
    isAppLocked(userId).then(state => {
      if (state.lockedAt) setLockedAt(new Date(state.lockedAt));
    });
  }, [userId]);

  const allYes = answers.every((a, i) => touched[i] && a === true);
  const elapsedHours = lockedAt ? (Date.now() - lockedAt.getTime()) / (1000 * 60 * 60) : 0;
  const enoughTime = elapsedHours >= MIN_LOCKOUT_HOURS;
  const canRelease = allYes && enoughTime;
  const hoursLeft = Math.max(0, Math.ceil(MIN_LOCKOUT_HOURS - elapsedHours));

  function setAnswer(i: number, v: boolean) {
    setAnswers(prev => prev.map((a, idx) => (idx === i ? v : a)));
    setTouched(prev => prev.map((t, idx) => (idx === i ? true : t)));
  }

  async function handleRelease() {
    if (!userId || !canRelease) return;
    setSubmitting(true);
    try {
      await acknowledgeLockout(userId, 'user_acknowledgment');
      Alert.alert('해제됐어', '천천히, 언제든 다시 와도 돼.', [
        { text: '응', onPress: () => router.replace('/(tabs)' as never) },
      ]);
    } catch (e) {
      console.warn('[safety] release failed:', e);
      Alert.alert('해제에 실패했어', '잠시 후 다시 시도해줘');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        {/* BackHeader 의도적 제거 — 위기 잠금 화면은 *최종 안전망*이라 사용자가 임의로 빠져나갈 수
            없어야 함. 해제는 4문항 통과 + 24h 경과 후 acknowledgeLockout으로만 가능. */}
        <Caption className="mb-2">안전 확인</Caption>
        <Display className="mb-2">천천히, 다시 만나자</Display>
        <Body className="text-gray-400 mb-6">
          잠금을 해제하기 전에 네 안전을 한 번만 더 확인할게.{'\n'}
          모두 "응"일 때만 해제할 수 있어.
        </Body>

        {!enoughTime && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Icon name="hourglass" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">아직 시간이 더 필요해</Body>
                <Caption className="text-gray-400 leading-5">
                  잠금 후 24시간이 지나야 해제 가능해. 약 {hoursLeft}시간 남았어.
                </Caption>
              </View>
            </View>
          </Card>
        )}

        <View className="gap-3 mb-6">
          {SAFETY_QUESTIONS.map((q, i) => (
            <Card key={i} className="p-4">
              <Body className="text-gray-200 mb-3 leading-6">{q}</Body>
              <View className="flex-row gap-2">
                <ToggleButton
                  label="응"
                  selected={touched[i] && answers[i] === true}
                  onPress={() => setAnswer(i, true)}
                />
                <ToggleButton
                  label="아니야"
                  selected={touched[i] && answers[i] === false}
                  onPress={() => setAnswer(i, false)}
                />
              </View>
            </Card>
          ))}
        </View>

        {touched.every(Boolean) && !allYes && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Icon name="heart" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">조금 더 함께 있어줄게</Body>
                <Caption className="text-gray-400 leading-5">
                  지금은 해제할 시점이 아닌 거 같아. 1393에 전화하거나, 신뢰할 수 있는 사람에게
                  옆에 있어달라 말해도 돼.
                </Caption>
              </View>
            </View>
          </Card>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton
          label="잠금 해제"
          onPress={handleRelease}
          loading={submitting}
          disabled={!canRelease}
        />
        <Pressable
          onPress={() => router.push('/resources/hotline' as never)}
          accessibilityRole="button"
        >
          <Caption className="text-center text-purple-400 py-3">위기 자원 다시 보기</Caption>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

function ToggleButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="flex-1 rounded-xl py-2.5 active:opacity-80"
      style={{
        backgroundColor: selected ? colors.purple[400] : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.purple[400] : colors.border,
      }}
    >
      <Body className="text-center font-medium" style={{ color: selected ? colors.white : colors.gray[400] }}>
        {label}
      </Body>
    </Pressable>
  );
}
