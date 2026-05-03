import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { isAppLocked } from '@/api/safety';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  getCompassGateDays,
  isCompassDisabledByPersona,
  isAnalysisTrackBlockedByPersona,
} from '@/constants/personaBranches';

/**
 * [나] 탭 — A-3·A-5
 *
 * about-me 트랙 + 자기 통찰 도구의 통합 허브.
 * 분석·나침반·졸업 트랙은 모두 여기로 흡수 (졸업은 A-4에서 보류).
 *
 * 게이트 정책:
 *  - D+7 baseline (기존 6-6) — D+7 미만이면 분석/나침반 카드 비활성. "아직 자신을 살피는 시간"
 *  - 페르소나별 게이트(P02=D+10, P04=D+14, P07=D+21, P13/P17=비활성)는 Phase C에서 적용
 */
const SELF_INSIGHT_GATE_DAYS = 7;

export default function MeScreen() {
  const { userId, daysElapsed } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);

  // 분석은 baseline D+7. 나침반은 페르소나별 게이트 (C-2-G-4): P02=10, P04=14, P07=21.
  const insightUnlocked = daysElapsed >= SELF_INSIGHT_GATE_DAYS;
  const compassGateDays = getCompassGateDays(personaPrimary);
  const compassUnlocked = daysElapsed >= compassGateDays;
  const compassDisabled = isCompassDisabledByPersona(personaPrimary);
  // C-2-G-6: P01·P14·P20은 분석 자체 부적합 (about-me로 우회)
  const analysisDisabled = isAnalysisTrackBlockedByPersona(personaPrimary);

  const insightDaysLeft = Math.max(0, SELF_INSIGHT_GATE_DAYS - daysElapsed);
  const compassDaysLeft = Math.max(0, compassGateDays - daysElapsed);

  // B-1 안전 잠금 — C-SSRS urgent/high 양성 시 결정 트랙 차단
  const [decisionLocked, setDecisionLocked] = useState(false);
  useEffect(() => {
    if (!userId) return;
    isAppLocked(userId)
      .then(state => setDecisionLocked(state.decisionLocked))
      .catch(() => {/* fail open — 잠금 조회 실패 시 보수적으로 unlocked */});
  }, [userId]);

  // 분석/나침반 진입 가능 여부
  const canEnterAnalysis = insightUnlocked && !decisionLocked && !analysisDisabled;
  const canEnterCompass = compassUnlocked && !decisionLocked && !compassDisabled;

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">나</Caption>
        <Display className="mb-2">너에 대해 알아가기</Display>
        <Body className="text-gray-400 mb-8">
          관계를 통해 보였던 너의 모습과, 지금의 너를 천천히 들여다봐.
        </Body>

        <View className="gap-3">
          {/* 자기 이야기는 항상 노출 — D+0부터 안전 */}
          <MeCard
            icon="users"
            title="내 이야기"
            subtitle="장단점·욕구·정체성 정리"
            onPress={() => router.push('/about-me' as never)}
          />

          {/* 분석 — D+7 baseline 게이트 + B-1 안전 잠금 + C-2-G-6 페르소나 차단 */}
          <MeCard
            icon="search"
            title="관계 분석"
            subtitle={
              decisionLocked
                ? '안전 확인 후 다시 만나자'
                : analysisDisabled
                  ? '지금은 *너에 대해* 트랙이 더 도움돼'
                  : insightUnlocked
                    ? '장단점·이유·역할 정리'
                    : `${insightDaysLeft}일 뒤 — 지금은 자신을 살피는 시간`
            }
            disabled={!canEnterAnalysis}
            onPress={() => router.push('/analysis/pros-cons' as never)}
          />
          {/* 나침반 — 페르소나별 게이트 (C-2-G-4) + 안전 잠금 + P17 영구 비활성 */}
          <MeCard
            icon="compass"
            title="오늘의 방향"
            subtitle={
              decisionLocked
                ? '안전 확인 후 다시 만나자'
                : compassDisabled
                  ? '지금은 결정보다 *수용*에 집중하자'
                  : compassUnlocked
                    ? '지금 마음이 어디를 향하는지'
                    : `${compassDaysLeft}일 뒤 — 결정보다 머무는 시간`
            }
            disabled={!canEnterCompass}
            onPress={() => router.push('/compass' as never)}
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

interface MeCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
}

function MeCard({ icon, title, subtitle, onPress, disabled }: MeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      className="active:opacity-80"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Card className="flex-row items-center gap-4 p-4">
        <Icon name={icon} size={22} color={colors.purple[400]} />
        <View className="flex-1">
          <Body className="font-medium">{title}</Body>
          <Caption className="text-gray-500 mt-0.5">{subtitle}</Caption>
        </View>
        {!disabled ? <Icon name="chevron-right" size={18} color={colors.gray[600]} /> : null}
      </Card>
    </Pressable>
  );
}
