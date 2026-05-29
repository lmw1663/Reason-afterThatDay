import { useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { ChangeIndicator } from './ChangeIndicator';
import { Icon, type IconName } from './Icon';
import type { Direction } from '@/store/useJournalStore';

/**
 * 4+1 마음 매트릭스 선택기.
 *
 * "방향(잡고/보내고) × 상대를 향한 마음(좋아/미움)"의 2×2 사분면 + '모르겠어' 1개.
 * 슬라이더(AffectionSlider)를 인터랙티브 카드 선택으로 대체한다.
 *
 * 저장은 기존 스키마 그대로 분해(B안): 선택값 → { direction, affectionLevel }.
 * affectionLevel(좋아=8 / 미움=2 / 모르겠어=중립 5)은
 * compassVerdictWithAffection 임계값(≥7, ≤3)에 정확히 맞물려 나침반 verdict가 그대로 분화된다.
 */
export type MoodMatrixValue =
  | 'letgo_love'
  | 'letgo_hate'
  | 'catch_hate'
  | 'catch_love'
  | 'undecided';

export const MOOD_MATRIX_MAP: Record<
  MoodMatrixValue,
  { direction: Direction; affectionLevel: number }
> = {
  letgo_love: { direction: 'let_go', affectionLevel: 8 },
  letgo_hate: { direction: 'let_go', affectionLevel: 2 },
  catch_hate: { direction: 'catch', affectionLevel: 2 },
  catch_love: { direction: 'catch', affectionLevel: 8 },
  undecided: { direction: 'undecided', affectionLevel: 5 },
};

interface Option {
  value: MoodMatrixValue;
  line1: string;
  line2: string;
  icon: IconName;
  accent: string;
  softBg: string;
}

// 사분면 배치: 위=보내고 싶어 / 아래=잡고 싶어, 왼쪽=밉기도 해 / 오른쪽=좋아
const QUADRANTS: Option[] = [
  { value: 'letgo_hate', line1: '보내고 싶어', line2: '밉기도 해',   icon: 'wind',        accent: colors.teal[400],   softBg: colors.overlayTealSoft },
  { value: 'letgo_love', line1: '보내고 싶어', line2: '그래도 좋아', icon: 'feather',     accent: colors.teal[400],   softBg: colors.overlayTealSoft },
  { value: 'catch_hate', line1: '잡고 싶은데', line2: '밉기도 해',   icon: 'heart-crack', accent: colors.coral[400],  softBg: colors.overlayCoralSoft },
  { value: 'catch_love', line1: '잡고 싶어',   line2: '여전히 좋아', icon: 'heart',       accent: colors.purple[400], softBg: colors.overlayPurpleSoft },
];

const UNDECIDED: Option = {
  value: 'undecided',
  line1: '아직 잘 모르겠어',
  line2: '어느 쪽인지 모르겠어',
  icon: 'fog',
  accent: colors.gray[400],
  softBg: colors.overlayGrayMuted,
};

interface CardProps {
  opt: Option;
  selected: boolean;
  onPress: () => void;
  variant: 'quadrant' | 'wide';
}

function MatrixCard({ opt, selected, onPress, variant }: CardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (v: number) =>
    Animated.spring(scale, {
      toValue: v,
      useNativeDriver: true,
      friction: 7,
      tension: 180,
    }).start();

  const isWide = variant === 'wide';

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => animateTo(0.96)}
      onPressOut={() => animateTo(1)}
      accessibilityRole="button"
      accessibilityLabel={`${opt.line1}, ${opt.line2}`}
      accessibilityState={{ selected }}
      style={isWide ? undefined : { flex: 1 }}
    >
      <Animated.View
        style={{
          transform: [{ scale }],
          minHeight: isWide ? 64 : 112,
          borderRadius: 18,
          borderWidth: selected ? 1.5 : 1,
          paddingHorizontal: 16,
          paddingVertical: isWide ? 16 : 14,
          backgroundColor: selected ? opt.softBg : colors.surface,
          borderColor: selected ? opt.accent : colors.border,
          flexDirection: isWide ? 'row' : 'column',
          alignItems: isWide ? 'center' : 'flex-start',
          justifyContent: isWide ? 'center' : 'space-between',
          gap: isWide ? 10 : 0,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignSelf: 'stretch',
          }}
        >
          <Icon name={opt.icon} size={22} color={selected ? opt.accent : colors.gray[400]} />
          {selected && (
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: opt.accent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={12} color={colors.white} strokeWidth={2.5} />
            </View>
          )}
        </View>

        <View style={isWide ? { alignItems: 'center' } : undefined}>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: selected ? opt.accent : colors.gray[50],
              marginTop: isWide ? 0 : 10,
            }}
          >
            {opt.line1}
          </Text>
          <Text style={{ fontSize: 13, color: colors.gray[400], marginTop: 2 }}>
            {opt.line2}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

interface Props {
  value: MoodMatrixValue | null;
  onChange: (value: MoodMatrixValue) => void;
  prevDirection?: Direction | null;
  changePrefix?: string;
  changeSuffix?: string;
}

export function MoodMatrixPicker({
  value,
  onChange,
  prevDirection = null,
  changePrefix,
  changeSuffix,
}: Props) {
  const currentDirection = value ? MOOD_MATRIX_MAP[value].direction : 'undecided';

  return (
    <View>
      <ChangeIndicator
        prev={prevDirection}
        current={currentDirection}
        prefix={changePrefix}
        suffix={changeSuffix}
      />

      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MatrixCard
            opt={QUADRANTS[0]}
            selected={value === QUADRANTS[0].value}
            onPress={() => onChange(QUADRANTS[0].value)}
            variant="quadrant"
          />
          <MatrixCard
            opt={QUADRANTS[1]}
            selected={value === QUADRANTS[1].value}
            onPress={() => onChange(QUADRANTS[1].value)}
            variant="quadrant"
          />
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <MatrixCard
            opt={QUADRANTS[2]}
            selected={value === QUADRANTS[2].value}
            onPress={() => onChange(QUADRANTS[2].value)}
            variant="quadrant"
          />
          <MatrixCard
            opt={QUADRANTS[3]}
            selected={value === QUADRANTS[3].value}
            onPress={() => onChange(QUADRANTS[3].value)}
            variant="quadrant"
          />
        </View>
        <MatrixCard
          opt={UNDECIDED}
          selected={value === UNDECIDED.value}
          onPress={() => onChange(UNDECIDED.value)}
          variant="wide"
        />
      </View>
    </View>
  );
}
