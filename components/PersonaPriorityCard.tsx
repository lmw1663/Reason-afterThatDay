import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card } from './ui/Card';
import { Body, Caption } from './ui/Typography';
import { Icon } from './ui/Icon';
import { colors } from '@/constants/colors';
import { PERSONA_CARDS, type PersonaCode } from '@/constants/personaCards';

interface Props {
  /** 활성 페르소나. null이면 카드 미노출 (P12 안정형 baseline 또는 페르소나 미정). */
  persona: PersonaCode | null;
}

// G-8: 매일 노출되는 페르소나 카드의 학습 부담을 줄이기 위해 사용자가 "나중에"를 누르면
// 24시간 숨김. AssessmentRecommendationCard와 동일한 dismiss 패턴 — 일관성 유지.
// 페르소나가 바뀌면 키도 분리되어 새 페르소나는 즉시 노출.
const DISMISS_KEY_PREFIX = 'persona_card_dismissed_v1:';
const DISMISS_TTL_MS = 24 * 3600 * 1000;

/**
 * 페르소나 우선 카드 슬롯 — A-6 (G-8에서 dismiss 24h 추가)
 *
 * [오늘] 화면 헤더 아래에 배치. 페르소나에 따라 *내용*이 달라지지만 라벨/아이콘에는
 * 페르소나 코드/명을 노출하지 않는다 (CLAUDE.md 라벨 비노출 원칙).
 */
export function PersonaPriorityCard({ persona }: Props) {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!persona) return;
    AsyncStorage.getItem(DISMISS_KEY_PREFIX + persona)
      .then((raw) => {
        if (!raw) return setDismissed(false);
        const t = Date.parse(raw);
        if (Number.isNaN(t)) return setDismissed(false);
        setDismissed(Date.now() - t < DISMISS_TTL_MS);
      })
      .catch(() => setDismissed(false));
  }, [persona]);

  if (!persona) return null;
  const card = PERSONA_CARDS[persona];
  if (!card) return null;
  // dismissed가 null인 동안(첫 렌더~AsyncStorage 응답 전)은 깜빡임 방지로 미노출.
  if (dismissed !== false) return null;

  async function handleDismiss() {
    setDismissed(true);
    await AsyncStorage.setItem(
      DISMISS_KEY_PREFIX + persona,
      new Date().toISOString(),
    ).catch(() => {});
  }

  return (
    <View className="px-6 mb-5">
      <Pressable
        onPress={() => router.push(card.route as Href)}
        accessibilityRole="button"
        accessibilityLabel={card.title}
        accessibilityHint={`${card.subtitle} 화면으로 이동`}
        className="active:opacity-80"
      >
        <Card className="flex-row items-center gap-4 p-4">
          <Icon name={card.icon} size={22} color={colors.purple[400]} />
          <View className="flex-1">
            <Body className="font-medium">{card.title}</Body>
            <Caption className="text-gray-500 mt-0.5">{card.subtitle}</Caption>
          </View>
          <Pressable
            onPress={handleDismiss}
            accessibilityRole="button"
            accessibilityLabel="나중에 — 오늘은 이 안내를 숨겨"
            hitSlop={8}
            className="active:opacity-60 px-2 py-1"
          >
            <Caption className="text-gray-600 text-xs">나중에</Caption>
          </Pressable>
          <Icon name="chevron-right" size={18} color={colors.gray[600]} />
        </Card>
      </Pressable>
    </View>
  );
}
