import { Text, View, ScrollView } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { ProgressDots } from '@/components/ui/ProgressDots';
import type { CompassVerdict } from '@/store/useDecisionStore';

const ACTION_MAP: Record<CompassVerdict, { title: string; actions: string[]; caution: string }> = {
  strong_catch: {
    title: '잡고 싶다면 이렇게 해봐',
    actions: [
      '연락 전에 내가 원하는 게 뭔지 한 문장으로 적어봐',
      '상대가 받아들일 준비가 됐는지 먼저 생각해봐',
      '결과와 상관없이 후회 없을 방식으로 표현해봐',
    ],
    caution: '연락은 충동적인 순간보다, 마음이 조금 가라앉았을 때가 나아.',
  },
  lean_catch: {
    title: '아직 확신이 없다면',
    actions: [
      '조금 더 시간을 두고 마음을 지켜봐',
      '일기에 오늘 느낀 걸 솔직하게 적어봐',
      '나침반을 일주일 뒤 다시 해봐도 좋아',
    ],
    caution: '서두르지 않아도 돼. 마음은 성급하게 결정하지 않아도 돼.',
  },
  undecided: {
    title: '아직 모르겠다면',
    actions: [
      '지금 느끼는 감정을 일기로 기록해봐',
      '가장 두려운 게 뭔지 적어봐',
      '친한 친구에게 이야기해봐',
    ],
    caution: '모르는 것도 하나의 답이야. 천천히 느껴봐.',
  },
  lean_let_go: {
    title: '보내는 방향으로 기울었다면',
    actions: [
      '상대를 위한 게 아닌, 나를 위한 선택인지 확인해봐',
      '앞으로의 내 삶에 집중할 작은 계획을 세워봐',
      '이 결정을 누군가에게 말해봐 — 소리 내면 명확해져',
    ],
    caution: '보내기로 했다고 약하거나 틀린 게 아니야.',
  },
  strong_let_go: {
    title: '보내주기로 했다면',
    actions: [
      '연락을 끊는 방식을 나답게 선택해봐',
      '상대를 원망하지 않고 마음속으로 작별하는 시간을 가져봐',
      '앞으로 나를 위한 첫 번째 하루를 계획해봐',
    ],
    caution: '보내는 것도 사랑의 한 방식이야. 충분히 잘 한 거야.',
  },
};

export default function CompassActionScreen() {
  const { verdict } = useLocalSearchParams<{ verdict: string }>();
  const v = (verdict ?? 'undecided') as CompassVerdict;
  const { title, actions, caution } = ACTION_MAP[v] ?? ACTION_MAP.undecided;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-sm mb-2">결정 나침반 · 5 / 5</Text>
        <Text className="text-white text-2xl font-bold mb-8">{title}</Text>

        <View className="gap-3 mb-6">
          {actions.map((action, i) => (
            <InsightCard key={i} tag={`${i + 1}`} body={action} accent="purple" />
          ))}
        </View>

        <View
          className="rounded-xl px-4 py-3 mb-8"
          style={{ backgroundColor: '#1A1A22', borderLeftWidth: 3, borderLeftColor: '#BA7517' }}
        >
          <Text className="text-amber-400 text-xs font-medium mb-1">참고해줘</Text>
          <Text className="text-gray-400 text-sm">{caution}</Text>
        </View>

        <ProgressDots total={5} current={5} />
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="일기 쓰러 가기"
          onPress={() => router.push('/journal')}
        />
        <PrimaryButton
          label="홈으로"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}
