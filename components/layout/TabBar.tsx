import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { motion } from '@/constants/motion';
import { useKnotStore } from '@/store/useKnotStore';

/**
 * 하단 탭바 — 커스텀 (레퍼런스 학습 기반 리뉴얼).
 *
 * 기존: Expo Router `Tabs` 기본 탭바(평면 + 상단 보더 + 11px 라벨). 구식·정적.
 * 변경: 화면에서 떠 있는 라운드 캡슐(floating capsule). 아이콘 전용 — 활성 표시는
 *       탭 사이를 *미끄러져 이동*하는 단일 보라 알약(sliding pill)으로 통일.
 *       아이콘 색은 알약 위치에 맞춰 회색↔보라 크로스페이드. 전부 Reanimated spring.
 *
 * 레퍼런스 차용(`docs/design/PATTERNS.md`):
 *  - Anz+   : floating + soft shadow, 활성 강조(원형 아이콘 배경)
 *  - Disney+: 다크 위 활성 아이콘 강조 / 비활성 그레이 (reason은 다크 테마)
 *  - 공통    : "하단 탭/CTA는 floating", "Pill 컨트롤 fully rounded", "컬러 절제"
 *  - 라벨 텍스트는 제거(아이콘만) — 미니멀·트렌디. 라벨은 a11y(스크린리더)에만 유지.
 *
 * 안전 정책 (중요):
 *  - 매듭(knot) 탭은 임상 안전 게이트 — knotTabVisible=false면 *절대* 노출 금지.
 *  - 노출 제어는 전적으로 아래 TAB_CONFIG 화이트리스트 + knotTabVisible 명시 체크가
 *    책임진다. (커스텀 tabBar는 `href:null`/`tabBarButton`을 읽지 않으므로
 *    state.routes에는 knot·analysis·compass·graduation이 그대로 남아 있다 —
 *    이 필터를 "state.routes 전체 순회"로 바꾸면 게이트가 깨지니 금지.)
 *  - position:absolute가 아닌 in-flow 캡슐 → 화면 콘텐츠와 겹치지 않음(패딩 불필요).
 */

interface TabDef {
  name: string;
  /** 화면엔 안 보이지만 스크린리더가 읽도록 유지하는 라벨 */
  a11yLabel: string;
  icon: IconName;
}

const TAB_CONFIG: readonly TabDef[] = [
  { name: 'index', a11yLabel: '오늘', icon: 'home' },
  { name: 'records', a11yLabel: '기록', icon: 'book' },
  { name: 'me', a11yLabel: '나', icon: 'smile' },
  { name: 'knot', a11yLabel: '매듭', icon: 'link' }, // 동적 — knotTabVisible 시에만
] as const;

const CAPSULE_PADDING = 8; // 캡슐 좌우 안쪽 여백
const PILL_W = 64; // 슬라이딩 알약 너비 (원형 44 → 가로로 넓힘)
const PILL_H = 44;

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const knotTabVisible = useKnotStore((s) => s.knotTabVisible);

  const items = TAB_CONFIG.filter((t) => {
    if (t.name === 'knot' && !knotTabVisible) return false;
    return state.routes.some((r) => r.name === t.name);
  });
  const count = items.length;

  // items 중 현재 활성 탭의 인덱스. 숨김 하위 라우트(compass 등)에 있으면 -1.
  const activeIndex = items.findIndex(
    (t) => state.index === state.routes.findIndex((r) => r.name === t.name),
  );

  // 트랙(아이템들이 깔리는 영역) 실측 폭 → 아이템 폭 = 트랙폭 / 개수
  const [trackW, setTrackW] = useState(0);
  const itemW = trackW > 0 && count > 0 ? trackW / count : 0;

  // 활성 인덱스를 spring으로 추종 — 알약이 탭 사이를 미끄러져 이동
  const pos = useSharedValue(Math.max(activeIndex, 0));
  useEffect(() => {
    if (activeIndex >= 0) pos.value = withSpring(activeIndex, motion.spring.standard);
  }, [activeIndex, pos]);

  const pillStyle = useAnimatedStyle(() => {
    const center = (pos.value + 0.5) * itemW; // 활성 탭 중심 x
    return {
      width: PILL_W,
      transform: [{ translateX: center - PILL_W / 2 }],
      // 폭 측정 전이거나 활성 탭이 없으면 숨김
      opacity: itemW > 0 && activeIndex >= 0 ? 1 : 0,
    };
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.capsule}>
        <View
          style={styles.track}
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
        >
          {/* 미끄러지는 활성 알약 — 아이콘들 뒤에 깔림 */}
          <Animated.View style={[styles.pill, pillStyle]} />

          {items.map((t, i) => {
            const routeIndex = state.routes.findIndex((r) => r.name === t.name);
            const route = state.routes[routeIndex];
            const focused = state.index === routeIndex;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TabItem
                key={route.key}
                icon={t.icon}
                a11yLabel={t.a11yLabel}
                index={i}
                pos={pos}
                focused={focused}
                onPress={onPress}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
}

interface TabItemProps {
  icon: IconName;
  a11yLabel: string;
  index: number;
  pos: SharedValue<number>;
  focused: boolean;
  onPress: () => void;
}

/**
 * 단일 탭 (아이콘 전용).
 *
 * 회색 아이콘 위에 보라 아이콘을 겹쳐두고, 알약 위치(pos)와의 거리로 보라 opacity를
 * 크로스페이드 — 알약이 도착하는 흐름과 색 전환이 동기화된다.
 */
function TabItem({ icon, a11yLabel, index, pos, focused, onPress }: TabItemProps) {
  const activeStyle = useAnimatedStyle(() => {
    const d = Math.abs(pos.value - index);
    return { opacity: Math.max(0, 1 - d) }; // 중심에서 1, 한 칸 벗어나면 0
  });

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={a11yLabel}
      hitSlop={10}
      pressScale={0.9}
      style={styles.itemTouchable}
    >
      <View style={styles.iconBox}>
        <Icon name={icon} size={24} color={colors.gray[600]} strokeWidth={1.8} />
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.iconBox, activeStyle]}>
          <Icon name={icon} size={24} color={colors.purple[400]} strokeWidth={2.1} />
        </Animated.View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg, // 화면 배경과 동일 → 캡슐만 떠 보임
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  capsule: {
    height: 60,
    paddingHorizontal: CAPSULE_PADDING,
    borderRadius: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    // 다크 위 미세한 부양감
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    position: 'absolute',
    height: PILL_H,
    top: (60 - PILL_H) / 2,
    left: 0,
    borderRadius: PILL_H / 2,
    backgroundColor: colors.overlayPurpleSoft,
  },
  itemTouchable: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
