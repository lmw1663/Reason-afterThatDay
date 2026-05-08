import { Pressable, View, StyleSheet } from 'react-native';
import { Caption } from './ui/Typography';
import { Icon } from './ui/Icon';
import { colors } from '@/constants/colors';

interface Props {
  onPress: () => void;
}

/**
 * "갑자기 떠올랐어" 진입 FAB — 우하단 고정.
 *
 * 침투사고는 *돌발 상황 대응* 도구라 ① 평소엔 시각 무게 낮고 ② 위기 시엔 즉시 발견 가능해야 함.
 * 기존 self-start 칩(홈 일기 CTA 아래)은 다른 보조 카드와 시각 리듬이 깨지고 위계가 모호했음
 * → ScrollView와 별개 layer의 floating pill로 격상해 동선 분리.
 *
 * **시각 위계**: 일기 PrimaryButton(보라 fill, 주 CTA)과 동급이 되지 않도록 surface fill +
 * purple border + 약한 shadow로 격하. 발견 가능하되 평상시 시선을 빼앗지 않음.
 *
 * 페르소나 게이팅 없음 — 침투사고는 이별 초기 누구나 겪을 수 있어 전 페르소나 동일 노출.
 * (참고: ContactUrgeChip은 임상 안전상 5종 차단 — `docs/persona-contact-urge-policy.md`.
 *  본 FAB는 "기록·외현화 의식"이라 모든 페르소나 안전.)
 *
 * 배치: ScreenWrapper(SafeAreaView) 내부 absolute → 탭바 위에 자연스럽게 떠 있음.
 */
export function IntrusiveMemoryFab({ onPress }: Props) {
  return (
    <View style={styles.container} pointerEvents="box-none">
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="갑자기 떠올랐어"
        accessibilityHint="기억이 갑자기 떠오를 때 호흡과 기록으로 진정시켜줘"
        hitSlop={8}
        className="flex-row items-center gap-2 rounded-full px-4 py-3 active:opacity-70"
        style={styles.pill}
      >
        <Icon name="fog" size={16} color={colors.purple[400]} />
        <Caption className="text-purple-400 font-semibold">갑자기 떠올랐어</Caption>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    zIndex: 10,
  },
  pill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.purple[400],
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
});
