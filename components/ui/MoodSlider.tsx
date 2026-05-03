import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  Text,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const SCORE_LABELS: Record<number, string> = {
  1: '완전 최악', 2: '많이 힘들어', 3: '힘들어',
  4: '좀 힘들어', 5: '그냥 그래',
  6: '그나마 괜찮아', 7: '꽤 괜찮아',
  8: '좋아', 9: '많이 좋아', 10: '최고야',
};

// 감정 온도 색상 매핑 — 힘듦=파란색(차갑고 가라앉음), 중립=회색, 괜찮음=초록, 좋음=따뜻한 밝은색.
function colorAt(score: number): string {
  if (score <= 2)  return colors.blue[600];
  if (score <= 4)  return colors.blue[400];
  if (score === 5) return colors.gray[400];
  if (score <= 7)  return colors.teal[400];
  if (score <= 9)  return colors.amber[400];
  return colors.purple[400];
}

const TRACK_HEIGHT = 14;
const THUMB_SIZE = 28;
const ROW_HEIGHT = 44;

function valueToRatio(v: number): number {
  return (v - 1) / 9;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function ratioToValue(r: number): number {
  return Math.round(clamp01(r) * 9) + 1;
}

export function MoodSlider({ value, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const usableWidth = Math.max(0, trackWidth - THUMB_SIZE);
  const thumbColor = colorAt(value);

  const animatedLeft = useRef(new Animated.Value(0)).current;
  const initialized = useRef(false);

  useEffect(() => {
    if (usableWidth === 0) return;
    const target = valueToRatio(value) * usableWidth;
    if (!initialized.current) {
      animatedLeft.setValue(target);
      initialized.current = true;
    } else {
      Animated.spring(animatedLeft, {
        toValue: target,
        useNativeDriver: false,
        friction: 9,
        tension: 140,
      }).start();
    }
  }, [value, usableWidth, animatedLeft]);

  // 클로저 stale 회피 — usableWidth/value/onChange 가 바뀔 때마다 PanResponder 재생성.
  // PanResponder.create 자체는 가벼워서 비용 거의 없음.
  const panResponder = useMemo(
    () => {
      const handle = (e: GestureResponderEvent) => {
        if (usableWidth === 0) return;
        const x = e.nativeEvent.locationX - THUMB_SIZE / 2;
        const next = ratioToValue(x / usableWidth);
        if (next !== value) onChange(next);
      };
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: handle,
        onPanResponderMove: handle,
      });
    },
    [usableWidth, value, onChange],
  );

  function onTrackLayout(e: LayoutChangeEvent) {
    setTrackWidth(e.nativeEvent.layout.width);
  }

  return (
    <View>
      {/* 점수 + 라벨 — 고정 높이 박스로 감싸 슬라이더 이동 시 vertical jitter 방지 */}
      <View
        style={{
          height: 84,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 10,
            height: 52,
          }}
        >
          <Animated.Text
            style={{
              fontSize: 44,
              fontWeight: '700',
              color: thumbColor,
              letterSpacing: -1.5,
              lineHeight: 52,
              minWidth: 56,
              textAlign: 'right',
            }}
          >
            {value}
          </Animated.Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 20,
              color: colors.gray[400],
              fontWeight: '400',
            }}
          >
            / 10
          </Text>
        </View>
        <Text
          style={{
            fontSize: 14,
            lineHeight: 20,
            color: thumbColor,
            fontWeight: '500',
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          {SCORE_LABELS[value]}
        </Text>
      </View>

      {/* 슬라이더 */}
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={`감정 온도, 현재 ${value}점, ${SCORE_LABELS[value]}`}
        accessibilityValue={{ min: 1, max: 10, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && value < 10) onChange(value + 1);
          if (e.nativeEvent.actionName === 'decrement' && value > 1) onChange(value - 1);
        }}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
        style={{ height: ROW_HEIGHT, justifyContent: 'center' }}
      >
        {/* 트랙 (그라데이션 — 항상 풀컬러로 부드럽게) */}
        {trackWidth > 0 && (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: TRACK_HEIGHT,
              alignSelf: 'center',
              borderRadius: TRACK_HEIGHT / 2,
              overflow: 'hidden',
            }}
          >
            <Svg width={trackWidth} height={TRACK_HEIGHT}>
              <Defs>
                <LinearGradient id="moodGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0"    stopColor={colors.blue[600]}   />
                  <Stop offset="0.3"  stopColor={colors.blue[400]}   />
                  <Stop offset="0.5"  stopColor={colors.gray[400]}   />
                  <Stop offset="0.7"  stopColor={colors.teal[400]}   />
                  <Stop offset="0.9"  stopColor={colors.amber[400]}  />
                  <Stop offset="1"    stopColor={colors.purple[400]} />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={trackWidth}
                height={TRACK_HEIGHT}
                fill="url(#moodGrad)"
              />
            </Svg>
            {/* 트랙 위에 살짝 어둡게 깔아서 thumb 영역만 도드라지게 — 비활성 톤 처리 */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(14,14,18,0.45)',
              }}
            />
          </View>
        )}

        {/* 활성 부분 — 0부터 thumb 위치까지 진한 색으로 */}
        {trackWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: 0,
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              overflow: 'hidden',
              width: Animated.add(animatedLeft, new Animated.Value(THUMB_SIZE / 2)),
            }}
          >
            {trackWidth > 0 && (
              <Svg width={trackWidth} height={TRACK_HEIGHT}>
                <Defs>
                  <LinearGradient id="moodGradActive" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0"    stopColor={colors.blue[600]}   />
                    <Stop offset="0.3"  stopColor={colors.blue[400]}   />
                    <Stop offset="0.5"  stopColor={colors.gray[400]}   />
                    <Stop offset="0.7"  stopColor={colors.teal[400]}   />
                    <Stop offset="0.9"  stopColor={colors.amber[400]}  />
                    <Stop offset="1"    stopColor={colors.purple[400]} />
                  </LinearGradient>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width={trackWidth}
                  height={TRACK_HEIGHT}
                  fill="url(#moodGradActive)"
                />
              </Svg>
            )}
          </Animated.View>
        )}

        {/* 썸 — 큰 흰 외곽 + 색 안쪽 + 그림자 */}
        {trackWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: animatedLeft,
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: colors.white,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.35,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 6,
            }}
          >
            <View
              style={{
                width: THUMB_SIZE - 10,
                height: THUMB_SIZE - 10,
                borderRadius: (THUMB_SIZE - 10) / 2,
                backgroundColor: thumbColor,
              }}
            />
          </Animated.View>
        )}
      </View>

      {/* 양 끝 */}
      <View className="flex-row justify-between mt-2 px-1">
        <Text style={{ fontSize: 11, color: colors.gray[600] }}>1</Text>
        <Text style={{ fontSize: 11, color: colors.gray[600] }}>10</Text>
      </View>
    </View>
  );
}
