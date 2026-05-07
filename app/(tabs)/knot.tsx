import { Redirect, router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useKnotPolicy } from '@/hooks/useKnotPolicy';

/**
 * 매듭 탭 진입 화면 — F-followup-3
 *
 * 권유 모달 승낙(recordAccept) 후 router.replace('/knot') 또는 매듭 탭 직접 탭으로 진입.
 *
 * 분기:
 *   - cooling status === 'cooling' → /cooling 진행 중인 유예로 redirect
 *   - 그 외 → 시작 안내 카드 + 5단계 흐름 미리보기 + "시작할게" 버튼
 *
 * 5단계 흐름은 graduation/report → letter → confirm → ritual → farewell → request 순서
 * (실제로는 6 화면이지만 사용자 인지상 *5단계*로 안내). F-7 어휘 교체로 각 화면이
 * 페르소나 라벨·일수를 동적으로 표시한다.
 */
export default function KnotEntry() {
  const { daysElapsed } = useUserStore();
  const status = useCoolingStore((s) => s.status);
  const { label, coolingDays } = useKnotPolicy();

  // cooling 진행 중이면 그 화면으로
  if (status === 'cooling') {
    return <Redirect href="/cooling" />;
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">D+{daysElapsed}</Caption>
        <Display className="mb-3">{label}</Display>
        <Body className="text-gray-400 mb-8 leading-relaxed">
          여기까지 와줘서 고마워.{'\n'}
          이제 {coolingDays}일 동안 함께 마무리해볼래.
        </Body>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Caption className="text-purple-400 mb-3">{label} 흐름 — 5단계</Caption>
          <View className="gap-2.5">
            <StepRow num={1} text="그동안의 회복 리포트 보기" />
            <StepRow num={2} text="나에게 쓰는 편지 받기" />
            <StepRow num={3} text="마지막으로 한 번 돌아보기" />
            <StepRow num={4} text="마지막 한 줄 남기기" />
            <StepRow num={5} text={`${label} 신청 → ${coolingDays}일 유예 시작`} />
          </View>
          <Caption className="text-gray-500 mt-3">총 5~10분 정도 걸려.</Caption>
        </Card>

        <Card className="mb-6">
          <Caption className="text-gray-400 leading-relaxed">
            정답이 아니야. 네 속도가 맞아.{'\n'}
            시작했다가 멈춰도 괜찮고, {label} 후에 다시 풀어도 괜찮아.
          </Caption>
        </Card>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="시작할게" onPress={() => router.push('/graduation/report')} />
        <PrimaryButton label="되돌아갈게" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}

function StepRow({ num, text }: { num: number; text: string }) {
  return (
    <View className="flex-row items-start gap-3">
      <View
        className="rounded-full items-center justify-center"
        style={{
          width: 22,
          height: 22,
          backgroundColor: colors.purple[400],
          opacity: 0.2,
        }}
      >
        <Caption className="text-purple-400 font-semibold">{num}</Caption>
      </View>
      <Body className="text-gray-300 flex-1 leading-snug">{text}</Body>
      <View className="mt-0.5">
        <Icon name="chevron-right" size={14} color={colors.gray[600]} />
      </View>
    </View>
  );
}
