import { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { usePersonaStore } from '@/store/usePersonaStore';
import { PERSONA_INTRO_CARDS } from '@/constants/personaIntroCards';

/**
 * 페르소나별 사전 안내 카드 — C-2-G-1
 *
 * 분류 직후 1화면 강제 노출. 페르소나가 baseline(P02·P12 등)이면 본 화면 진입 안 하고
 * 바로 홈으로 (onboarding/persona/index에서 분기).
 *
 * 라벨 비노출: 카드 내용만 다름. 화면 어디에도 페르소나 코드/명 없음.
 */
export default function PersonaIntroScreen() {
  const primary = usePersonaStore(s => s.primary);
  const card = primary ? PERSONA_INTRO_CARDS[primary] : null;

  // 안내 카드 없는 페르소나가 직접 진입한 경우 홈으로 우회.
  // render 본문에서 router.replace 호출하면 React 경고 → useEffect로 분리.
  useEffect(() => {
    if (!card) router.replace('/(tabs)' as never);
  }, [card]);

  if (!card) return null;

  function handleAcknowledge() {
    router.replace('/(tabs)' as never);
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">시작하기 전에</Caption>
        <Display className="mb-6">{card.title}</Display>

        <Card className="p-5">
          <View className="flex-row items-start gap-3">
            <Icon name={card.icon} size={22} color={colors.purple[400]} />
            <Body className="flex-1 leading-7 text-gray-200">{card.body}</Body>
          </View>
        </Card>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton label="알겠어, 시작할게" onPress={handleAcknowledge} />
      </View>
    </ScreenWrapper>
  );
}
