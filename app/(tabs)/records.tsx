import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useStaggerEntrance } from '@/hooks/useStaggerEntrance';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { shouldShowIntrusiveTrend } from '@/constants/personaBranches';
import { getIntrusiveMemoryTrend } from '@/api/intrusiveMemory';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';
import { trackEvent } from '@/api/telemetry';

/**
 * [기록] 탭 — A-3
 *
 * 6개 동일 패턴 카드의 단조로움 해소. 사용 빈도 기반 시각 위계로 재구성:
 *  - Hero: 일기 모아보기 (가장 자주 진입)
 *  - 2x2 Grid: 추억 · 회복의 결 · 질문통 · 내가 답한 질문 (동등한 위계)
 *  - Footer: 매듭의 흔적 (조건부, teal accent로 톤 분리)
 *
 * 절대 규칙: 채팅 UI 금지·페르소나 라벨 비노출·D+N 표시 모두 무관 (디자인만).
 */
export default function RecordsScreen() {
  const { userId } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const showIntrusiveTrend = shouldShowIntrusiveTrend(personaPrimary);
  const lastKnotAt = useRelationshipStore((s) => s.profile.lastKnotAt);
  const hasKnotHistory = lastKnotAt !== null;

  useScreenView('records', { persona_category: anonymizePersona(personaPrimary) });
  useEffect(() => {
    if (showIntrusiveTrend) {
      trackEvent('persona_branch_applied', {
        screen: 'records',
        branch: 'intrusive_trend_widget',
        persona_category: anonymizePersona(personaPrimary),
      });
    }
  }, [showIntrusiveTrend, personaPrimary]);

  // C-2-G-7b: P09 떠올랐어 카운터·추세
  const [trend, setTrend] = useState<{ recent: number; previous: number } | null>(null);
  useEffect(() => {
    if (!userId || !showIntrusiveTrend) return;
    void getIntrusiveMemoryTrend(userId, 7)
      .then(setTrend)
      .catch(() => {/* fail open */});
  }, [userId, showIntrusiveTrend]);

  return (
    <ScreenWrapper entrance="none">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">기록</Caption>
        <Display className="mb-2">네가 걸어온 길</Display>
        <Body className="text-gray-400 mb-8">
          그동안 적은 일기와 회상, 회복의 흔적이 모여 있어.
        </Body>

        {/* C-2-G-7b: P09 떠올랐어 추세 카드 — 헌신 소진형만 노출 */}
        {showIntrusiveTrend && trend && (
          <Card className="p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <Icon name="trending-up" size={20} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">
                  지난 7일: {trend.recent}번 떠올랐어
                </Body>
                <Caption className="text-gray-400 leading-5">
                  {trend.recent < trend.previous
                    ? `그 전 7일(${trend.previous}번)보다 줄었어. 회복이 진행 중이야.`
                    : trend.recent === trend.previous
                      ? `그 전 7일과 같아. 평소대로 너를 돌봐주자.`
                      : `그 전 7일(${trend.previous}번)보다 늘었어. 천천히 자기 욕구를 살펴보자.`}
                </Caption>
              </View>
            </View>
          </Card>
        )}

        {/* Hero — 일기 모아보기 (사용 빈도 1위) */}
        <View className="mb-3">
          <RecordHero
            icon="pen"
            title="일기 모아보기"
            subtitle="오늘까지 적은 일기"
            staggerIndex={0}
            onPress={() => router.push('/journal/history' as never)}
          />
        </View>

        {/* 2x2 Grid — 동등한 위계의 4개 카드 (stagger 1~4) */}
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            marginHorizontal: -6,
            marginBottom: hasKnotHistory ? 12 : 0,
          }}
        >
          <RecordGridItem
            icon="archive"
            title="추억"
            subtitle="사진·메시지·장소"
            staggerIndex={1}
            onPress={() => router.push('/memories' as never)}
          />
          <RecordGridItem
            icon="chart"
            title="회복의 결"
            subtitle="처음과 지금 비교"
            staggerIndex={2}
            onPress={() => router.push('/recovery-trace' as never)}
          />
          <RecordGridItem
            icon="leaf"
            title="질문통"
            subtitle="골라 답해봐"
            staggerIndex={3}
            onPress={() => router.push('/question-pool' as never)}
          />
          <RecordGridItem
            icon="message-circle"
            title="답한 질문"
            subtitle="자유 질문 모음"
            staggerIndex={4}
            onPress={() => router.push('/answers' as never)}
          />
        </View>

        {/* Footer — 매듭의 흔적 (조건부, teal로 톤 분리) */}
        {hasKnotHistory && (
          <RecordKnotBanner
            staggerIndex={5}
            onPress={() => router.push('/knot/archive' as never)}
          />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

interface RecordHeroProps {
  icon: IconName;
  title: string;
  subtitle: string;
  staggerIndex: number;
  onPress: () => void;
}

function RecordHero({ icon, title, subtitle, staggerIndex, onPress }: RecordHeroProps) {
  const enterStyle = useStaggerEntrance(staggerIndex);
  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: 'rgba(127,119,221,0.18)',
          padding: 20,
          minHeight: 124,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.overlayPurpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={26} color={colors.purple[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Body style={{ fontSize: 18, fontWeight: '700' }}>{title}</Body>
          <Caption className="text-gray-500 mt-1">{subtitle}</Caption>
        </View>
        <Icon name="chevron-right" size={20} color={colors.gray[600]} />
      </AnimatedPressable>
    </Animated.View>
  );
}

interface RecordGridProps {
  icon: IconName;
  title: string;
  subtitle: string;
  staggerIndex: number;
  onPress: () => void;
}

function RecordGridItem({ icon, title, subtitle, staggerIndex, onPress }: RecordGridProps) {
  const enterStyle = useStaggerEntrance(staggerIndex);
  return (
    <Animated.View
      style={[{ width: '50%', paddingHorizontal: 6, marginBottom: 12 }, enterStyle]}
    >
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          minHeight: 132,
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.overlayPurpleSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={20} color={colors.purple[400]} />
        </View>
        <View style={{ marginTop: 16 }}>
          <Body style={{ fontSize: 15, fontWeight: '600' }}>{title}</Body>
          <Caption className="text-gray-500 mt-0.5">{subtitle}</Caption>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function RecordKnotBanner({ staggerIndex, onPress }: { staggerIndex: number; onPress: () => void }) {
  const enterStyle = useStaggerEntrance(staggerIndex);
  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="매듭의 흔적"
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: 'rgba(29,158,117,0.22)',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginTop: 4,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.overlayTealSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="link" size={20} color={colors.teal[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Body className="font-medium">매듭의 흔적</Body>
          <Caption className="text-gray-500 mt-0.5">지나온 사이클들을 시간 순으로</Caption>
        </View>
        <Icon name="chevron-right" size={18} color={colors.gray[600]} />
      </AnimatedPressable>
    </Animated.View>
  );
}
