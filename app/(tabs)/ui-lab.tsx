import { Redirect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';

/**
 * UI 실험실 — __DEV__ 전용 트렌디 방향 시범 화면.
 *
 * "단색이라 지루하다"는 피드백에 대해, 검색·학습한 2025~2026 트렌드 3종을
 * 한 화면에 모아 비교용으로 렌더. 실제 앱 화면엔 영향 없음.
 *  ① 영역별 액센트 컬러 — 이미 정의된 teal/blue/coral/amber 팔레트를 맥락별로
 *  ② 앰비언트 그라데이션 글로우 — SVG radial orb로 다크 위 깊이감
 *  ③ 글래스 / 반투명(Liquid Glass) — LinearGradient 배경 + BlurView
 *
 * production 빌드에서는 즉시 홈으로 redirect (앱 노출 금지). 패턴은 dev/cooling-preview.tsx 참조.
 */

interface AccentDef {
  label: string;
  sub: string;
  icon: IconName;
  accent: string;
  soft: string; // 아이콘 칩 배경 (저알파)
  rim: string; // 카드 테두리 (중알파)
}

const ACCENTS: readonly AccentDef[] = [
  { label: '오늘', sub: '홈·일기', icon: 'home', accent: colors.purple[400], soft: 'rgba(127,119,221,0.14)', rim: 'rgba(127,119,221,0.40)' },
  { label: '기록', sub: '네가 걸어온 길', icon: 'book', accent: colors.teal[400], soft: 'rgba(29,158,117,0.14)', rim: 'rgba(29,158,117,0.40)' },
  { label: '나', sub: '관계·방향', icon: 'smile', accent: colors.blue[400], soft: 'rgba(91,143,232,0.14)', rim: 'rgba(91,143,232,0.40)' },
  { label: '매듭', sub: '사이클의 챕터', icon: 'link', accent: colors.amber[400], soft: 'rgba(186,117,23,0.16)', rim: 'rgba(186,117,23,0.42)' },
];

export default function UiLabScreen() {
  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <ScreenWrapper entrance="slide">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40 }}
      >
        <Caption className="mb-2">개발 전용</Caption>
        <Display className="mb-2">UI 실험실</Display>
        <Body className="text-gray-400 mb-8">트렌디 방향 3종 시범 — 마음에 드는 걸 골라줘.</Body>

        {/* ① 영역별 액센트 컬러 */}
        <Heading className="mb-1">① 영역별 액센트 컬러</Heading>
        <Caption className="text-gray-500 mb-4">
          이미 정의돼 안 쓰던 팔레트를 영역별로 — 단색 탈피 + 시스템 일관성.
        </Caption>
        <View style={styles.grid}>
          {ACCENTS.map((a) => (
            <View key={a.label} style={styles.gridCell}>
              <View style={[styles.accentCard, { borderColor: a.rim }]}>
                <View style={[styles.accentChip, { backgroundColor: a.soft }]}>
                  <Icon name={a.icon} size={22} color={a.accent} />
                </View>
                <Body style={{ fontSize: 15, fontWeight: '700', color: a.accent }}>{a.label}</Body>
                <Caption className="text-gray-500 mt-0.5">{a.sub}</Caption>
              </View>
            </View>
          ))}
        </View>

        {/* ② 앰비언트 그라데이션 글로우 */}
        <Heading className="mt-8 mb-1">② 앰비언트 글로우</Heading>
        <Caption className="text-gray-500 mb-4">
          히어로/홈 뒤에 은은한 컬러 오브 — 다크 위 깊이감, 차분함 유지.
        </Caption>
        <View style={styles.glowCard}>
          <Svg style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="orbA" cx="28%" cy="22%" r="60%">
                <Stop offset="0" stopColor={colors.purple[400]} stopOpacity={0.55} />
                <Stop offset="1" stopColor={colors.purple[400]} stopOpacity={0} />
              </RadialGradient>
              <RadialGradient id="orbB" cx="82%" cy="95%" r="60%">
                <Stop offset="0" stopColor={colors.teal[400]} stopOpacity={0.45} />
                <Stop offset="1" stopColor={colors.teal[400]} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#orbA)" />
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#orbB)" />
          </Svg>
          <Caption className="text-gray-400">함께한 날을 세는 중</Caption>
          <Display style={{ fontSize: 44, marginTop: 4 }}>D+217</Display>
          <Body className="text-gray-300 mt-1">천천히, 너의 속도로 걸어가고 있어.</Body>
        </View>

        {/* ③ 글래스 / 반투명 (Liquid Glass) */}
        <Heading className="mt-8 mb-1">③ 글래스 (Liquid Glass)</Heading>
        <Caption className="text-gray-500 mb-4">
          반투명 유리 위 컬러가 비침 — iOS 26 미감. (Android는 빌드에 따라 약하게 보일 수 있음)
        </Caption>
        <LinearGradient
          colors={[colors.purple[600], colors.blue[600], colors.teal[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glassBackdrop}
        >
          <BlurView
            intensity={32}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={styles.glassPanel}
          >
            <View style={styles.glassRow}>
              <View style={styles.glassIcon}>
                <Icon name="sparkles" size={20} color={colors.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Body style={{ color: colors.white, fontWeight: '700' }}>오늘의 한마디</Body>
                <Caption style={{ color: 'rgba(255,255,255,0.75)' }} className="mt-0.5">
                  유리 너머로 컬러가 은은히 비쳐.
                </Caption>
              </View>
            </View>
            <View style={styles.glassPill}>
              <Body style={{ color: colors.white, fontSize: 13, fontWeight: '600' }}>열어보기</Body>
            </View>
          </BlurView>
        </LinearGradient>

        <Caption className="text-gray-600 mt-8 text-center">
          이 화면은 개발 빌드에서만 보여 · 실제 앱엔 영향 없음
        </Caption>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  accentCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    minHeight: 116,
    justifyContent: 'space-between',
  },
  accentChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  glowCard: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    minHeight: 150,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glassBackdrop: {
    borderRadius: 28,
    padding: 14,
  },
  glassPanel: {
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  glassRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  glassIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  glassPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
});
