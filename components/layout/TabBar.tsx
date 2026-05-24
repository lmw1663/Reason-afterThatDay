import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
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
 * 변경: 화면에서 떠 있는 라운드 캡슐(floating capsule). 아이콘 전용 — 활성 탭만
 *       보라 원형 하이라이트 + 살짝 커지는 pop. 누름·전환은 Reanimated spring.
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

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const knotTabVisible = useKnotStore((s) => s.knotTabVisible);

  const items = TAB_CONFIG.filter((t) => {
    if (t.name === 'knot' && !knotTabVisible) return false;
    return state.routes.some((r) => r.name === t.name);
  });

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.capsule}>
        {items.map((t) => {
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
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

interface TabItemProps {
  icon: IconName;
  a11yLabel: string;
  focused: boolean;
  onPress: () => void;
}

/**
 * 단일 탭 (아이콘 전용).
 *
 * progress(0→1) spring으로: ① 보라 원형 배경 페이드 ② 칩 살짝 커짐(0.9→1.0).
 * 비활성은 그레이 아이콘 + 투명 배경.
 */
function TabItem({ icon, a11yLabel, focused, onPress }: TabItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, motion.spring.standard);
  }, [focused, progress]);

  const chipStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['rgba(127,119,221,0)', colors.overlayPurpleSoft],
    ),
    transform: [{ scale: 0.9 + progress.value * 0.1 }],
  }));

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
      <Animated.View style={[styles.chip, chipStyle]}>
        <Icon
          name={icon}
          size={24}
          color={focused ? colors.purple[400] : colors.gray[600]}
          strokeWidth={focused ? 2.1 : 1.8}
        />
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 60,
    paddingHorizontal: 8,
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
  itemTouchable: {
    borderRadius: 22,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
