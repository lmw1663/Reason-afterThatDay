import { useState } from 'react';
import { Redirect } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';

/**
 * UI 실험실 — __DEV__ 전용. 트렌디 방향 3종을 각각 "오늘 탭" 풀스크린 목업으로 시범.
 *
 * 상단 선택기로 전환:
 *  ① 컬러   — 카드마다 다른 액센트(보라/teal/blue/amber). 단색 탈피 + 시스템 유지.
 *  ② 글로우 — 화면 전체에 SVG radial orb. 다크 위 깊이감, 차분함 유지.
 *  ③ 글래스 — 화면 전체 컬러 그라데이션 + 반투명 패널(유리 흉내).
 *
 * 모두 react-native-svg만 사용(네이티브 리빌드 불필요). production은 즉시 redirect.
 */

type Variant = 'accent' | 'glow' | 'glass';

const VARIANTS: { key: Variant; label: string }[] = [
  { key: 'accent', label: '① 컬러' },
  { key: 'glow', label: '② 글로우' },
  { key: 'glass', label: '③ 글래스' },
];

interface CardSpec {
  icon: IconName;
  title: string;
  sub: string;
  accent: string;
  rim: string; // accent 테두리 (저알파)
}

const CARDS: readonly CardSpec[] = [
  { icon: 'pen', title: '오늘 일기 쓰기', sub: '오늘의 마음을 한 줄 남겨봐', accent: colors.purple[400], rim: 'rgba(127,119,221,0.45)' },
  { icon: 'leaf', title: '오늘의 질문', sub: '골라서 답해보는 한 가지', accent: colors.teal[400], rim: 'rgba(29,158,117,0.45)' },
  { icon: 'thermometer', title: '마음 날씨', sub: '요즘 감정 흐름 들여다보기', accent: colors.blue[400], rim: 'rgba(91,143,232,0.45)' },
  { icon: 'sparkles', title: '오늘의 한마디', sub: '너에게 건네는 한 문장', accent: colors.amber[400], rim: 'rgba(186,117,23,0.5)' },
];

export default function UiLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }
  return <UiLab />;
}

function UiLab() {
  const [variant, setVariant] = useState<Variant>('accent');
  const insets = useSafeAreaInsets();
  const onGradient = variant === 'glass';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {variant === 'glow' && <GlowBackground />}
      {variant === 'glass' && <GlassBackground />}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 72,
          paddingHorizontal: 24,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 홈 헤더 — D+N */}
        <Caption style={onGradient ? { color: 'rgba(255,255,255,0.7)' } : undefined}>
          5월 24일 일요일
        </Caption>
        <Display style={{ fontSize: 56, marginTop: 4, color: colors.white }}>D+217</Display>
        <Body
          className="mt-2"
          style={{ fontSize: 16, color: onGradient ? 'rgba(255,255,255,0.85)' : colors.gray[400] }}
        >
          천천히, 너의 속도로 걸어가고 있어.
        </Body>

        {/* 카드 묶음 */}
        <View style={{ marginTop: 28, gap: 14 }}>
          {CARDS.map((c, i) => (
            <MockCard key={c.title} spec={c} variant={variant} hero={i === 0} />
          ))}
        </View>
      </ScrollView>

      {/* 상단 변형 선택기 (고정) */}
      <View style={[styles.switcherWrap, { top: insets.top + 10 }]}>
        <View style={styles.switcher}>
          {VARIANTS.map((v) => {
            const active = v.key === variant;
            return (
              <Pressable
                key={v.key}
                onPress={() => setVariant(v.key)}
                accessibilityRole="button"
                style={[styles.switchPill, active && styles.switchPillActive]}
              >
                <Text style={[styles.switchText, active && styles.switchTextActive]}>{v.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

/** ② 화면 전체 앰비언트 글로우 — 보라·blue·teal orb 3개 */
function GlowBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="glow1" cx="18%" cy="10%" r="55%">
          <Stop offset="0" stopColor={colors.purple[400]} stopOpacity={0.5} />
          <Stop offset="1" stopColor={colors.purple[400]} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glow2" cx="95%" cy="38%" r="50%">
          <Stop offset="0" stopColor={colors.blue[400]} stopOpacity={0.38} />
          <Stop offset="1" stopColor={colors.blue[400]} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="glow3" cx="28%" cy="92%" r="55%">
          <Stop offset="0" stopColor={colors.teal[400]} stopOpacity={0.4} />
          <Stop offset="1" stopColor={colors.teal[400]} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow1)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow2)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glow3)" />
    </Svg>
  );
}

/** ③ 화면 전체 컬러 그라데이션 (유리 배경) */
function GlassBackground() {
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="glassFull" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.purple[800]} />
          <Stop offset="0.5" stopColor={colors.blue[800]} />
          <Stop offset="1" stopColor={colors.teal[800]} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#glassFull)" />
    </Svg>
  );
}

function MockCard({ spec, variant, hero }: { spec: CardSpec; variant: Variant; hero: boolean }) {
  const iconSize = hero ? 34 : 28;

  // 변형별 카드 스타일
  const cardStyle =
    variant === 'accent'
      ? { backgroundColor: colors.surface, borderColor: spec.rim }
      : variant === 'glow'
        ? { backgroundColor: 'rgba(26,26,34,0.66)', borderColor: colors.border }
        : { backgroundColor: 'rgba(255,255,255,0.10)', borderColor: 'rgba(255,255,255,0.22)' };

  const iconColor = variant === 'glass' ? colors.white : spec.accent;
  const titleColor = variant === 'accent' ? spec.accent : colors.white;
  const subColor = variant === 'glass' ? 'rgba(255,255,255,0.75)' : colors.gray[400];

  return (
    <View
      style={[
        styles.card,
        cardStyle,
        hero && { minHeight: 116 },
      ]}
    >
      {/* 글래스: 패널 위 흰 시언 */}
      {variant === 'glass' && (
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          <Defs>
            <SvgLinearGradient id={`sheen-${spec.title}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.14} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#sheen-${spec.title})`} />
        </Svg>
      )}

      <Icon name={spec.icon} size={iconSize} color={iconColor} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontSize: hero ? 18 : 16, fontWeight: '700', color: titleColor }}>
          {spec.title}
        </Body>
        <Caption style={{ marginTop: 3, fontSize: 13, color: subColor }}>{spec.sub}</Caption>
      </View>
      <Icon
        name="chevron-right"
        size={20}
        color={variant === 'glass' ? 'rgba(255,255,255,0.6)' : colors.gray[600]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    minHeight: 84,
    overflow: 'hidden',
  },
  switcherWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  switcher: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(14,14,18,0.7)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  switchPill: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  switchPillActive: {
    backgroundColor: colors.purple[400],
  },
  switchText: {
    fontFamily: 'Pretendard',
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray[400],
  },
  switchTextActive: {
    color: colors.white,
  },
});
