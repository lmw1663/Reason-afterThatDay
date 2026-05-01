import { View, ScrollView } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';

const REFLECTION_BY_CATEGORY: Record<string, { title: string; message: string; accent: 'purple' | 'teal' | 'coral' | 'amber' }> = {
  happy: {
    title: '그 행복은 진짜였어',
    message: '그 순간의 행복은 사라지지 않아. 기억 속에 살아있고, 언제든 따뜻하게 떠올릴 수 있어. 그 시간이 있었기에 지금의 너가 있어.',
    accent: 'teal',
  },
  miss: {
    title: '그리움은 사랑이야',
    message: '그리움이 느껴진다는 건 그 관계가 그만큼 소중했다는 거야. 그리워하는 자신을 비난하지 마. 그 감정 자체가 아름다운 거야.',
    accent: 'purple',
  },
  painful: {
    title: '그 아픔도 너의 일부야',
    message: '아팠던 만큼 느낀 거야. 그 감정은 틀리지 않아. 지금 이 순간, 그 아픔을 가진 채로도 앞으로 나아갈 수 있어.',
    accent: 'coral',
  },
  growth: {
    title: '너는 달라졌어',
    message: '이 관계가 너를 바꿔놓았어. 상처도 있지만, 그 안에서 성장한 부분도 분명히 있어. 그 변화가 앞으로의 너를 더 단단하게 만들 거야.',
    accent: 'amber',
  },
};

export default function MemoryReflectScreen() {
  const { category, memory, feeling } = useLocalSearchParams<{
    category: string;
    memory: string;
    feeling: string;
  }>();

  const reflection = REFLECTION_BY_CATEGORY[category] ?? REFLECTION_BY_CATEGORY['happy'];

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">추억 정리</Caption>
        <Heading className="mb-8">{reflection.title}</Heading>

        {memory ? (
          <Card className="mb-6" style={{ borderLeftWidth: 3, borderLeftColor: colors.gray[800] }}>
            <Caption className="text-gray-500 mb-2">기억한 것</Caption>
            <Body className="text-gray-300 leading-relaxed">{memory}</Body>
            {feeling ? (
              <>
                <Caption className="text-gray-500 mt-4 mb-2">그때의 감정</Caption>
                <Body className="text-gray-300 leading-relaxed">{feeling}</Body>
              </>
            ) : null}
          </Card>
        ) : null}

        <Card variant="subtle" accent={reflection.accent} className="mb-8">
          <Body className="text-gray-200 leading-relaxed">{reflection.message}</Body>
        </Card>

        <Card className="mb-4">
          <Caption className="text-gray-500 mb-2">기억하면 좋은 것</Caption>
          <Body className="text-gray-400 leading-relaxed">
            이 추억을 꺼내본 지금 이 순간이 치유의 한 부분이야.{'\n'}
            언제든 또 꺼내봐도 괜찮아.
          </Body>
        </Card>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="다른 기억 꺼내보기"
          onPress={() => router.push('/memory' as Href)}
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
