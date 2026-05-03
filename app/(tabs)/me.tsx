import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';

/**
 * [나] 탭 — A-3
 *
 * about-me 트랙 + 자기 통찰 도구의 통합 허브.
 * placeholder — 본 구현은 A-5(분석·나침반 흡수) + Phase C(페르소나 게이트)에서 완성.
 *
 * 정책:
 *  - 분석·나침반은 페르소나·D+N 게이트를 거쳐 진입 (Phase C에서 게이트 적용)
 *  - 카테고리 노출 순서·비활성화는 매트릭스 §2 C5 참조
 */
export default function MeScreen() {
  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">나</Caption>
        <Display className="mb-2">너에 대해 알아가기</Display>
        <Body className="text-gray-400 mb-8">
          관계를 통해 보였던 너의 모습과, 지금의 너를 천천히 들여다봐.
        </Body>

        <View className="gap-3">
          <MeCard
            icon="users"
            title="내 이야기"
            subtitle="장단점·욕구·정체성 정리"
            onPress={() => router.push('/about-me' as never)}
          />
          {/* TODO A-5: 페르소나·D+N 게이트 적용 — 현재는 직진 가능, 게이트 우회 위험 */}
          <MeCard
            icon="search"
            title="관계 분석"
            subtitle="장단점·이유·역할 (D+7 이후 권장)"
            onPress={() => router.push('/analysis/pros-cons' as never)}
          />
          {/* TODO A-5: 페르소나별 진입 가능 시점 다름 (P02=D+10, P04=D+14, P07=D+21, P13/P17=비활성). 매트릭스 §2 C4 참조 */}
          <MeCard
            icon="compass"
            title="오늘의 방향"
            subtitle="지금 마음이 어디를 향하는지"
            onPress={() => router.push('/compass' as never)}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

interface MeCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
}

function MeCard({ icon, title, subtitle, onPress }: MeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      className="active:opacity-80"
    >
      <Card className="flex-row items-center gap-4 p-4">
        <Icon name={icon} size={22} color={colors.purple[400]} />
        <View className="flex-1">
          <Body className="font-medium">{title}</Body>
          <Caption className="text-gray-500 mt-0.5">{subtitle}</Caption>
        </View>
        <Icon name="chevron-right" size={18} color={colors.gray[600]} />
      </Card>
    </Pressable>
  );
}
