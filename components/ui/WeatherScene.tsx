import { useEffect, useId, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Line,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { motion } from '@/constants/motion';

interface Props {
  /** 감정 온도 1~10. 끊김 없이 보간되어 모든 레이어의 입력이 된다. */
  score: number;
  width: number;
  height?: number;
  /**
   * 번개 flash 비활성. P10(분노)·위기 신호(C-SSRS 양성)·새벽 진입 등
   * 자극이 위험한 상황에서 호출자가 true로 끈다. 기본값 false.
   */
  disableLightning?: boolean;
}

/**
 * 감정 온도 1~10 → 날씨 신(scene). 연속 보간으로 자연스러운 전환.
 *
 *  score 1~3   폭풍우 — 검은 구름 + 비 + 가끔 번개 (disableLightning 우선)
 *  score 4~6   흐림 — 회색 구름 다층
 *  score 7~8   옅은 구름 + 해 시작
 *  score 9~10  쾌청 — 해 + 광채 ray (천천히 회전)
 *
 * 각 layer는 같은 scoreSV를 받아 useDerivedValue로 자체 opacity/position
 * 보간 → 슬라이더 끌 때 모든 layer가 동시에 자연스럽게 흐름.
 * Ambient motion(구름 drift / 해 광채 회전 / 비 fall / 번개 flash)은
 * 별도 sharedValue로 loop.
 *
 * SVG id는 useId 기반 suffix로 namespacing — 같은 화면에 두 인스턴스가
 * 마운트돼도 그라데이션이 섞이지 않음.
 */
export function WeatherScene({ score, width, height = 180, disableLightning = false }: Props) {
  const scoreSV = useSharedValue(score);
  useEffect(() => {
    scoreSV.value = withSpring(score, motion.spring.soft);
  }, [score, scoreSV]);

  const t = useDerivedValue(() => (scoreSV.value - 1) / 9);

  const uid = useId().replace(/:/g, '');

  return (
    <View
      style={{
        width,
        height,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#0E0E12',
      }}
    >
      <SkyBackground width={width} height={height} t={t} uid={uid} />
      <SunLayer width={width} height={height} t={t} uid={uid} />
      <CloudsLayer width={width} t={t} />
      <RainLayer width={width} height={height} t={t} />
      {!disableLightning && <LightningLayer t={t} />}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 하늘 배경 — 3 layer(storm/cloudy/sunny) 정적 그라데이션을 score에 따라
// opacity 보간으로 cross-fade. AnimatedStop이 react-native-svg의 host
// instance를 못 잡는 호환성 이슈 회피.
// ---------------------------------------------------------------------------

interface SkyStage {
  id: string;
  topColor: string;
  bottomColor: string;
}

function SkyBackground({
  width,
  height,
  t,
  uid,
}: {
  width: number;
  height: number;
  t: SharedValue<number>;
  uid: string;
}) {
  const stages: SkyStage[] = [
    { id: `storm-${uid}`,  topColor: '#0F1320', bottomColor: '#1A1E2A' },
    { id: `cloudy-${uid}`, topColor: '#2A2F3D', bottomColor: '#5C6275' },
    { id: `sunny-${uid}`,  topColor: '#5A8AB8', bottomColor: '#EBC8A6' },
  ];

  const stormStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.4, 0.6], [1, 0.4, 0], 'clamp'),
  }));
  const cloudyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.3, 0.5, 0.85], [0, 0.7, 1, 0], 'clamp'),
  }));
  const sunnyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.5, 0.75, 1], [0, 0.6, 1], 'clamp'),
  }));

  const layerStyles = [stormStyle, cloudyStyle, sunnyStyle];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {stages.map((stage, i) => (
        <Animated.View
          key={stage.id}
          style={[StyleSheet.absoluteFillObject, layerStyles[i]]}
        >
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id={stage.id} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={stage.topColor} />
                <Stop offset="1" stopColor={stage.bottomColor} />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill={`url(#${stage.id})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// 해 + 광채 — score 7~10에서 fade in. 광채는 ambient 회전.
// ---------------------------------------------------------------------------

function SunLayer({
  width,
  t,
  uid,
}: {
  width: number;
  height: number;
  t: SharedValue<number>;
  uid: string;
}) {
  const rotate = useSharedValue(0);
  useEffect(() => {
    rotate.value = withRepeat(
      withTiming(360, { duration: 28000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotate]);

  const sunStyle = useAnimatedStyle(() => {
    const opacity = interpolate(t.value, [0.6, 0.78, 1], [0, 0.7, 1], 'clamp');
    const scale = interpolate(t.value, [0.6, 1], [0.85, 1], 'clamp');
    const ty = interpolate(t.value, [0.6, 1], [10, 0], 'clamp');
    return {
      opacity,
      transform: [{ translateY: ty }, { scale }],
    };
  });

  const rayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(t.value, [0.75, 1], [0, 0.65], 'clamp');
    return {
      opacity,
      transform: [{ rotate: `${rotate.value}deg` }],
    };
  });

  const sunCx = width - 56;
  const sunCy = 56;
  const sunR = 26;
  const rayLen = 18;
  const rayBoxSize = (sunR + rayLen + 12) * 2;

  const sunBodyId = `sunBody-${uid}`;
  const rayGlowId = `rayGlow-${uid}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {/* 광채 ray — 별도 회전 transform */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: sunCx - (sunR + rayLen + 12),
            top: sunCy - (sunR + rayLen + 12),
            width: rayBoxSize,
            height: rayBoxSize,
          },
          rayStyle,
        ]}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient id={rayGlowId} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <Stop offset="0" stopColor="#FFE4B5" stopOpacity={0.7} />
              <Stop offset="1" stopColor="#FFE4B5" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx="50%" cy="50%" r="50%" fill={`url(#${rayGlowId})`} />
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 360) / 12;
            const rad = (angle * Math.PI) / 180;
            const inner = sunR + 8;
            const outer = sunR + rayLen + 8;
            const cx = sunR + rayLen + 12;
            const cy = sunR + rayLen + 12;
            return (
              <Line
                key={i}
                x1={cx + Math.cos(rad) * inner}
                y1={cy + Math.sin(rad) * inner}
                x2={cx + Math.cos(rad) * outer}
                y2={cy + Math.sin(rad) * outer}
                stroke="#FFD79A"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.85}
              />
            );
          })}
        </Svg>
      </Animated.View>

      {/* 해 본체 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: sunCx - sunR,
            top: sunCy - sunR,
            width: sunR * 2,
            height: sunR * 2,
          },
          sunStyle,
        ]}
      >
        <Svg width={sunR * 2} height={sunR * 2}>
          <Defs>
            <RadialGradient id={sunBodyId} cx="50%" cy="45%" r="55%" fx="50%" fy="45%">
              <Stop offset="0" stopColor="#FFF1C5" stopOpacity={1} />
              <Stop offset="1" stopColor="#FFB347" stopOpacity={1} />
            </RadialGradient>
          </Defs>
          <Circle cx={sunR} cy={sunR} r={sunR - 1} fill={`url(#${sunBodyId})`} />
        </Svg>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// 구름 — 4개 layered. 색·opacity는 자식 덩어리에도 동기, drift는 부모만.
// ---------------------------------------------------------------------------

interface CloudSpec {
  baseX: number;
  y: number;
  scale: number;
  driftDuration: number;
  /** [stormColor, cloudyColor, sunnyColor] — score 0/0.5/1 시 색 */
  colors: [string, string, string];
}

function CloudsLayer({
  width,
  t,
}: {
  width: number;
  t: SharedValue<number>;
}) {
  const clouds: CloudSpec[] = useMemo(
    () => [
      { baseX: 0.15, y: 28, scale: 1.0, driftDuration: 22000, colors: ['#1A1A20', '#5C5F6E', '#FFFFFF'] },
      { baseX: 0.55, y: 18, scale: 1.3, driftDuration: 30000, colors: ['#15151B', '#6B6E7C', '#FFFFFF'] },
      { baseX: 0.3, y: 70, scale: 0.85, driftDuration: 18000, colors: ['#202028', '#73768A', '#FAFAFF'] },
      { baseX: 0.78, y: 88, scale: 0.9, driftDuration: 26000, colors: ['#1A1A22', '#5F6275', '#FFFFFF'] },
    ],
    [],
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      {clouds.map((c, i) => (
        <Cloud key={i} spec={c} width={width} t={t} />
      ))}
    </View>
  );
}

function Cloud({
  spec,
  width,
  t,
}: {
  spec: CloudSpec;
  width: number;
  t: SharedValue<number>;
}) {
  const drift = useSharedValue(0);
  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: spec.driftDuration, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: spec.driftDuration, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [drift, spec.driftDuration]);

  // 부모: opacity + transform (drift)
  const containerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      t.value,
      [0, 0.3, 0.6, 0.85, 1],
      [0.95, 0.9, 0.7, 0.4, 0.15],
      'clamp',
    );
    const tx = interpolate(drift.value, [0, 1], [-width * 0.08, width * 0.08]);
    return {
      opacity,
      transform: [{ translateX: tx }],
    };
  });

  // 색상 전용 — 본체+자식 덩어리 모두 같은 색 (transform/opacity 중복 회피)
  const colorStyle = useAnimatedStyle(() => {
    const color = interpolateColor(t.value, [0, 0.5, 1], spec.colors);
    return { backgroundColor: color };
  });

  const cloudWidth = 92 * spec.scale;
  const cloudHeight = 32 * spec.scale;
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: spec.baseX * width - cloudWidth / 2,
          top: spec.y,
          width: cloudWidth,
          height: cloudHeight,
        },
        containerStyle,
      ]}
    >
      {/* 본체 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            width: cloudWidth,
            height: cloudHeight,
            borderRadius: cloudHeight,
          },
          colorStyle,
        ]}
      />
      {/* 좌측 둥근 덩어리 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -cloudHeight * 0.55,
            left: cloudWidth * 0.18,
            width: cloudHeight * 1.2,
            height: cloudHeight * 1.2,
            borderRadius: cloudHeight,
          },
          colorStyle,
        ]}
      />
      {/* 우측 더 큰 덩어리 */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -cloudHeight * 0.7,
            left: cloudWidth * 0.42,
            width: cloudHeight * 1.5,
            height: cloudHeight * 1.5,
            borderRadius: cloudHeight,
          },
          colorStyle,
        ]}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// 비 — score 0~0.25에서만 visible. 짧은 선들이 위→아래 loop.
// ---------------------------------------------------------------------------

function RainLayer({
  width,
  height,
  t,
}: {
  width: number;
  height: number;
  t: SharedValue<number>;
}) {
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.18, 0.3], [0.85, 0.7, 0], 'clamp'),
  }));

  const drops = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => {
        const x = (i / 14) * width + ((i % 3) * 7);
        return { x, dur: 800 + ((i * 67) % 700), delay: (i * 137) % 1200 };
      }),
    [width],
  );

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, opacityStyle]}
    >
      {drops.map((d, i) => (
        <Raindrop key={i} x={d.x} duration={d.dur} delay={d.delay} height={height} />
      ))}
    </Animated.View>
  );
}

function Raindrop({
  x,
  duration,
  delay,
  height,
}: {
  x: number;
  duration: number;
  delay: number;
  height: number;
}) {
  const y = useSharedValue(-20);
  useEffect(() => {
    // 첫 사이클만 delay, 이후엔 매끄러운 fall loop
    y.value = -20;
    y.value = withSequence(
      withTiming(-20, { duration: delay, easing: Easing.linear }),
      withRepeat(
        withTiming(height + 20, { duration, easing: Easing.linear }),
        -1,
        false,
      ),
    );
  }, [y, duration, delay, height]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: 0,
          width: 1.5,
          height: 12,
          backgroundColor: '#9FB4D9',
          borderRadius: 1,
          opacity: 0.7,
        },
        style,
      ]}
    />
  );
}

// ---------------------------------------------------------------------------
// 번개 flash — score 0~0.18에서 약 9초 간격 옅은 플래시 (자극 회피).
// 호출자가 disableLightning으로 끌 수 있음.
// ---------------------------------------------------------------------------

function LightningLayer({ t }: { t: SharedValue<number> }) {
  const flash = useSharedValue(0);

  useEffect(() => {
    const tick = () => {
      flash.value = withSequence(
        withTiming(1, { duration: 80, easing: Easing.out(Easing.quad) }),
        withTiming(0.3, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 600, easing: Easing.out(Easing.quad) }),
      );
    };
    // 마운트 직후 즉시 발화 X — 첫 번쩍을 지연(9s)해 사용자가 화면에 적응할 시간 확보
    const id = setInterval(tick, 9000);
    return () => clearInterval(id);
  }, [flash]);

  const style = useAnimatedStyle(() => {
    const gate = interpolate(t.value, [0, 0.12, 0.2], [1, 0.5, 0], 'clamp');
    return {
      opacity: flash.value * gate * 0.22,
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { backgroundColor: '#E8E2F5' }, style]}
    />
  );
}
