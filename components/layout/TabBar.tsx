import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
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
import { tabSlideDirection } from './tabSlideDirection';

/**
 * 하단 탭바 — 커스텀 (레퍼런스 학습 기반 리뉴얼).
 *
 * 기존: Expo Router `Tabs` 기본 탭바(평면 + 상단 보더 + 11px 라벨). 구식·정적.
 * 변경: 배경 박스 없이 화면 배경 위에 아이콘 + 하단 라벨만 얹는 미니멀 구성.
 *       활성 표시는 배경 알약 없이 *색*으로만 — 회색↔보라 크로스페이드(Reanimated spring).
 *
 * 레퍼런스 차용(`docs/design/PATTERNS.md`):
 *  - Anz+   : floating + soft shadow, 짧은 라벨
 *  - Disney+: 다크 위 활성 아이콘 강조 / 비활성 그레이 (reason은 다크 테마)
 *  - 공통    : "하단 탭/CTA는 floating", "컬러 절제"
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
  label: string;
  icon: IconName;
  /** __DEV__ 빌드에서만 노출 (UI 실험실 등) */
  dev?: boolean;
}

const TAB_CONFIG: readonly TabDef[] = [
  { name: 'index', label: '오늘', icon: 'home' },
  { name: 'records', label: '기록', icon: 'book' },
  { name: 'me', label: '나', icon: 'smile' },
  { name: 'knot', label: '매듭', icon: 'link' }, // 동적 — knotTabVisible 시에만
  { name: 'ui-lab', label: '실험실', icon: 'sparkles', dev: true }, // __DEV__ 전용 데모
] as const;

const CAPSULE_H = 72; // 아이콘 + 하단 라벨을 담도록 세로 확장

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const knotTabVisible = useKnotStore((s) => s.knotTabVisible);

  const items = TAB_CONFIG.filter((t) => {
    if (t.dev && !__DEV__) return false;
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
              // 이동 방향 기록 → 새 화면이 오른쪽(+)/왼쪽(-) 어디서 슬라이드할지 결정.
              // TAB_CONFIG 시각 순서 = state.routes 선언 순서라 인덱스 비교로 방향 산출.
              tabSlideDirection.set(routeIndex - state.index);
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              icon={t.icon}
              label={t.label}
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
  label: string;
  focused: boolean;
  onPress: () => void;
}

/**
 * 단일 탭 (아이콘 + 하단 라벨).
 *
 * 회색 묶음(아이콘+라벨) 위에 보라 묶음을 정확히 겹쳐두고, focus 시 보라 opacity를
 * spring으로 0↔1 크로스페이드 — 배경 알약 없이 색만으로 활성 표시.
 */
function TabItem({ icon, label, focused, onPress }: TabItemProps) {
  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, motion.spring.standard);
  }, [focused, progress]);

  const activeStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  return (
    <AnimatedPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      hitSlop={8}
      pressScale={0.92}
      style={styles.itemTouchable}
    >
      {/* 비활성(회색) 묶음 */}
      <View style={styles.stack}>
        <Icon name={icon} size={27} color={colors.gray[600]} strokeWidth={1.8} />
        <Text style={[styles.label, { color: colors.gray[600] }]}>{label}</Text>
      </View>
      {/* 활성(보라) 묶음 — 정확히 겹쳐서 크로스페이드 */}
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.stack, activeStyle]}>
        <Icon name={icon} size={27} color={colors.purple[400]} strokeWidth={2.1} />
        <Text style={[styles.label, { color: colors.purple[400] }]}>{label}</Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg, // 화면 배경과 동일 → 탭바가 배경에 자연스럽게 녹아듦
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  capsule: {
    // 배경 캡슐 제거 — 아이콘/라벨이 화면 배경 위에 바로 얹힘. 레이아웃 용도만 유지.
    flexDirection: 'row',
    alignItems: 'center',
    height: CAPSULE_H,
    paddingHorizontal: 8,
  },
  itemTouchable: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
});
