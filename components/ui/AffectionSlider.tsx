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

const TRACK_HEIGHT = 14;
const THUMB_SIZE = 28;
const ROW_HEIGHT = 44;

function colorAt(score: number): string {
  if (score <= 3) return colors.coral[400];
  if (score <= 6) return colors.gray[400];
  return colors.purple[400];
}

function valueToRatio(v: number): number {
  return v / 10;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function ratioToValue(r: number): number {
  return Math.round(clamp01(r) * 10);
}

export function AffectionSlider({ value, onChange }: Props) {
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
      <View
        style={{
          height: 64,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: 8,
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
      </View>

      <View
        accessibilityRole="adjustable"
        accessibilityLabel={`애정 수준, 현재 ${value}점`}
        accessibilityValue={{ min: 0, max: 10, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (e.nativeEvent.actionName === 'increment' && value < 10) onChange(value + 1);
          if (e.nativeEvent.actionName === 'decrement' && value > 0) onChange(value - 1);
        }}
        onLayout={onTrackLayout}
        {...panResponder.panHandlers}
        style={{ height: ROW_HEIGHT, justifyContent: 'center' }}
      >
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
                <LinearGradient id="affectionGrad" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0"   stopColor={colors.coral[400]}  />
                  <Stop offset="0.5" stopColor={colors.gray[400]}   />
                  <Stop offset="1"   stopColor={colors.purple[400]} />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={trackWidth}
                height={TRACK_HEIGHT}
                fill="url(#affectionGrad)"
              />
            </Svg>
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
            <Svg width={trackWidth} height={TRACK_HEIGHT}>
              <Defs>
                <LinearGradient id="affectionGradActive" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0"   stopColor={colors.coral[400]}  />
                  <Stop offset="0.5" stopColor={colors.gray[400]}   />
                  <Stop offset="1"   stopColor={colors.purple[400]} />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width={trackWidth}
                height={TRACK_HEIGHT}
                fill="url(#affectionGradActive)"
              />
            </Svg>
          </Animated.View>
        )}

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
    </View>
  );
}
