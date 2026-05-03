import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Card } from './ui/Card';
import { Body, Caption } from './ui/Typography';
import { Icon } from './ui/Icon';
import { colors } from '@/constants/colors';
import { PERSONA_CARDS, type PersonaCode } from '@/constants/personaCards';

interface Props {
  /** 활성 페르소나. null이면 카드 미노출 (P12 안정형 baseline 또는 페르소나 미정). */
  persona: PersonaCode | null;
}

/**
 * 페르소나 우선 카드 슬롯 — A-6
 *
 * [오늘] 화면 헤더 아래에 배치. 페르소나에 따라 *내용*이 달라지지만 라벨/아이콘에는
 * 페르소나 코드/명을 노출하지 않는다 (CLAUDE.md 라벨 비노출 원칙).
 *
 * Phase C: `usePersonaStore`가 활성 페르소나를 반환하면 본 슬롯에 전달.
 * 현재(Phase A)는 페르소나 시스템 미구현이라 항상 null이 들어와 슬롯이 비어있음.
 */
export function PersonaPriorityCard({ persona }: Props) {
  if (!persona) return null;
  const card = PERSONA_CARDS[persona];
  if (!card) return null;

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
          <Icon name="chevron-right" size={18} color={colors.gray[600]} />
        </Card>
      </Pressable>
    </View>
  );
}
