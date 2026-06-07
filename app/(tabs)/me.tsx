import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useStaggerEntrance } from '@/hooks/useStaggerEntrance';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';
import { useUserStore } from '@/store/useUserStore';
import { isAppLocked } from '@/api/safety';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getCompassGateDays,
  isCompassDisabledByPersona,
  isAnalysisTrackBlockedByPersona,
} from '@/constants/personaBranches';
import { resolvePersona, appliesGuard, longestGate } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';

/**
 * [나] 탭 — A-3·A-5
 *
 * 3개 동일 카드 단조로움 해소. "내 이야기"를 Hero로 격상(D+0부터 항상 활성,
 * 정체성 정리의 시작점). 분석·나침반은 Pair로 묶고 게이트 보조라인은 보존.
 *
 * 게이트 정책:
 *  - D+7 baseline (기존 6-6) — 분석 트랙 baseline
 *  - 페르소나별 나침반 게이트(P02=D+10, P04=D+14, P07=D+21, P13/P17 비활성)
 *  - B-1 안전 잠금(C-SSRS 양성) 시 결정 트랙 차단
 *  - C-2-G-6 페르소나 차단(P01·P14·P20 분석 자체 부적합)
 */
const SELF_INSIGHT_GATE_DAYS = 7;

export default function MeScreen() {
  const { userId, daysElapsed } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const personaSecondary = usePersonaStore(s => s.secondary);

  const resolved = resolvePersona(personaPrimary, personaSecondary);

  const insightUnlocked = daysElapsed >= SELF_INSIGHT_GATE_DAYS;
  const compassGateDays = longestGate(resolved, getCompassGateDays);
  const compassUnlocked = daysElapsed >= compassGateDays;
  const compassDisabled = appliesGuard(resolved, isCompassDisabledByPersona);
  const analysisDisabled = appliesGuard(resolved, isAnalysisTrackBlockedByPersona);

  const insightDaysLeft = Math.max(0, SELF_INSIGHT_GATE_DAYS - daysElapsed);
  const compassDaysLeft = Math.max(0, compassGateDays - daysElapsed);

  useScreenView('me', { persona_category: anonymizePersona(resolved.effective) });

  const [decisionLocked, setDecisionLocked] = useState(false);
  useEffect(() => {
    if (!userId) return;
    isAppLocked(userId)
      .then(state => setDecisionLocked(state.decisionLocked))
      .catch(() => {/* fail open */});
  }, [userId]);

  const canEnterAnalysis = insightUnlocked && !decisionLocked && !analysisDisabled;
  const canEnterCompass = compassUnlocked && !decisionLocked && !compassDisabled;

  const analysisSubtitle = decisionLocked
    ? '안전 확인 후 다시 만나자'
    : analysisDisabled
      ? '지금은 내 이야기에 더 집중하자'
      : insightUnlocked
        ? '장단점·이유·역할 정리'
        : `${insightDaysLeft}일 뒤 — 지금은 자신을 살피는 시간`;

  const compassSubtitle = decisionLocked
    ? '안전 확인 후 다시 만나자'
    : compassDisabled
      ? '지금은 결정보다 수용에 집중하자'
      : compassUnlocked
        ? '지금 마음이 어디를 향하는지'
        : `${compassDaysLeft}일 뒤 — 결정보다 머무는 시간`;

  return (
    <ScreenWrapper entrance="slide">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">나</Caption>
        <Display className="mb-2">너에 대해 알아가기</Display>
        <Body className="text-gray-400 mb-8">
          관계를 통해 보였던 너의 모습과, 지금의 너를 천천히 들여다봐.
        </Body>

        {/* Hero — 내 이야기 (D+0부터 항상 활성, 정체성 정리의 시작점) */}
        <View className="mb-3">
          <MeHero
            icon="users"
            title="내 이야기"
            subtitle="장단점·욕구·정체성 정리"
            staggerIndex={0}
            onPress={() => router.push('/about-me' as never)}
          />
        </View>

        {/* Pair — 결정 트랙 두 카드 (게이트 보조라인 보존, stagger 1~2) */}
        <View className="gap-3">
          <MePairCard
            icon="search"
            title="관계 분석"
            subtitle={analysisSubtitle}
            disabled={!canEnterAnalysis}
            staggerIndex={1}
            onPress={() => router.push('/analysis/pros-cons' as never)}
          />
          <MePairCard
            icon="compass"
            title="오늘의 방향"
            subtitle={compassSubtitle}
            disabled={!canEnterCompass}
            staggerIndex={2}
            onPress={() => router.push('/compass' as never)}
          />
        </View>

        {/* X-1 PIPA 데이터 관리 — 항상 노출 (열람·반출·삭제 권리)
            "설정" 캡션으로 시각 그룹이 분리되므로 stagger 시퀀스도 0부터 재시작. */}
        <View className="mt-6">
          <Caption className="text-gray-500 mb-2">설정</Caption>
          <MePairCard
            icon="shield"
            title="내 데이터 관리"
            subtitle="기록 보기 · 내보내기 · 삭제"
            staggerIndex={0}
            onPress={() => router.push('/settings/data' as never)}
          />
        </View>

        {decisionLocked ? (
          <Card className="mt-6 p-4">
            <View className="flex-row items-start gap-3">
              <Icon name="heart" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">지금은 안전이 먼저야</Body>
                <Caption className="text-gray-400 leading-5">
                  결정 트랙을 잠시 닫아뒀어. 안전 확인을 거치면 다시 열려.
                </Caption>
                <Pressable
                  onPress={() => router.push('/safety/release' as never)}
                  accessibilityRole="button"
                  className="mt-2"
                >
                  <Caption className="text-purple-400">해제 절차로 가기 ›</Caption>
                </Pressable>
              </View>
            </View>
          </Card>
        ) : !insightUnlocked ? (
          <Card className="mt-6 p-4">
            <View className="flex-row items-start gap-3">
              <Icon name="hourglass" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Caption className="text-gray-400 leading-5">
                  이별 직후엔 분석이 오히려 자책이 되기 쉬워. 일주일은 그냥 흘려보내고,
                  자기 자신을 들여다보는 데 집중하자.
                </Caption>
              </View>
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </ScreenWrapper>
  );
}

interface MeHeroProps {
  icon: IconName;
  title: string;
  subtitle: string;
  staggerIndex: number;
  onPress: () => void;
}

function MeHero({ icon, title, subtitle, staggerIndex, onPress }: MeHeroProps) {
  const enterStyle = useStaggerEntrance(staggerIndex);
  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: colors.borderPurpleSoft,
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={34} color={colors.purple[400]} />
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

interface MePairCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  staggerIndex: number;
  onPress: () => void;
  disabled?: boolean;
}

function MePairCard({ icon, title, subtitle, staggerIndex, onPress, disabled }: MePairCardProps) {
  const enterStyle = useStaggerEntrance(staggerIndex);
  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled }}
        disabled={disabled}
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={icon} size={28} color={colors.purple[400]} />
        </View>
        <View style={{ flex: 1 }}>
          <Body className="font-medium">{title}</Body>
          <Caption className="text-gray-500 mt-0.5">{subtitle}</Caption>
        </View>
        {!disabled && <Icon name="chevron-right" size={18} color={colors.gray[600]} />}
      </AnimatedPressable>
    </Animated.View>
  );
}
