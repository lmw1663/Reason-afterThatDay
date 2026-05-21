import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { AnimatedPressable } from './AnimatedPressable';
import { Icon } from './Icon';
import { colors } from '@/constants/colors';
import { motion } from '@/constants/motion';
import { EMOTION_ICON, type EmotionLabel } from '@/constants/emotionLabels';

interface Props {
  emotions: readonly string[];
  selected: string[];
  onToggle: (label: string) => void;
  /** 한 줄에 몇 개 — 기본 3. 좁은 화면에서 라벨이 잘리면 호출자가 3을 전달. */
  columns?: 3 | 4;
}

/**
 * 감정 라벨 그리드 카드 picker.
 *
 * Pill(rounded-full 32px)이 라벨 길이별 wrap이 불규칙해 시각 정렬이 무너지던 한계
 * 해소를 위해 격자형 카드로 재설계. 각 카드는 76px 정사각형에 가까운 비율로
 * 상단 라인 아이콘 + 하단 라벨. 선택 시 scale 1.03 pop spring + 우상단 check 뱃지.
 *
 * P08(권태) 등 페르소나별 라벨 정렬은 호출자가 `emotions` 배열 순서로 결정 — 본
 * 컴포넌트는 순서를 바꾸지 않음.
 */
export function EmotionPickerCard({ emotions, selected, onToggle, columns = 3 }: Props) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -4,
      }}
    >
      {emotions.map((label) => (
        <View
          key={label}
          style={{
            width: `${100 / columns}%`,
            paddingHorizontal: 4,
            marginBottom: 8,
          }}
        >
          <EmotionCell
            label={label}
            selected={selected.includes(label)}
            onPress={() => onToggle(label)}
          />
        </View>
      ))}
    </View>
  );
}

interface CellProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function EmotionCell({ label, selected, onPress }: CellProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.03 : 1, motion.spring.pop);
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconName = (EMOTION_ICON as Record<string, string>)[label] ?? 'sparkles';
  const accent = colors.purple[400];

  return (
    <Animated.View style={animatedStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked: selected }}
        pressScale={0.96}
        style={{
          height: 76,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: selected ? accent : colors.border,
          backgroundColor: selected ? colors.overlayPurpleSoft : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 6,
        }}
      >
        <Icon
          name={iconName as never}
          size={20}
          color={selected ? accent : colors.gray[400]}
          strokeWidth={1.8}
        />
        <Text
          style={{
            fontFamily: 'Pretendard',
            fontSize: 13,
            fontWeight: selected ? '600' : '500',
            color: selected ? colors.white : colors.gray[50],
            marginTop: 6,
            textAlign: 'center',
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
        {selected && (
          <View
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="check" size={10} color={colors.white} strokeWidth={2.5} />
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

// EmotionLabel 타입은 외부에서 가져올 수 있게 re-export (편의)
export type { EmotionLabel };
