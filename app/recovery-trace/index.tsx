import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { LineChart } from 'react-native-chart-kit';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import {
  getRecoveryTrace,
  type RecoveryTrace,
  type TimePoint,
} from '@/api/assessments';
import { bandMetaphor, type Instrument } from '@/utils/scoring';
import { useScreenView } from '@/hooks/useScreenView';

// D-6 회복 추적 화면 (구현계획 §3-2-C).
//
// 정책:
//  · D+0 vs 현재 *메타포 비교 카드* (점수 노출 X — bandMetaphor만)
//  · 시계열 그래프 (PHQ9·GAD7·RSE 각각, 데이터 2점 이상일 때만)
//  · "정답이 아니야" 디스클레이머 + 결과는 자기 점검 도구임을 명시
//  · D+0 데이터가 없으면 비교 카드 대신 "첫 측정해보기" CTA
//  · 졸업 시점 진입은 별도 entry — 본 화면은 자기 추적 항상 접근 가능

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 48;

export default function RecoveryTraceScreen() {
  const { userId } = useUserStore();
  const [trace, setTrace] = useState<RecoveryTrace | null>(null);
  const [loading, setLoading] = useState(true);

  useScreenView('recovery_trace');

  useEffect(() => {
    if (!userId) return;
    getRecoveryTrace(userId)
      .then(setTrace)
      .catch(() => setTrace(null))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={colors.purple[400]} />
        </View>
      </ScreenWrapper>
    );
  }

  const hasAny = trace && (trace.phq9.length > 0 || trace.gad7.length > 0 || trace.rse.length > 0);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader label="뒤로" />
        <Heading className="mb-1">회복의 결</Heading>
        <Caption className="text-gray-500 mb-6">
          오늘까지 쌓인 마음의 결을 보자. 정답이 아니야.
        </Caption>

        {!hasAny ? <EmptyState /> : (
          <>
            <ComparisonCard
              instrument="PHQ9"
              label="마음 무게"
              d0={trace!.d0Snapshot.phq9}
              current={trace!.currentSnapshot.phq9}
              series={trace!.phq9}
            />
            <ComparisonCard
              instrument="GAD7"
              label="마음의 파도"
              d0={trace!.d0Snapshot.gad7}
              current={trace!.currentSnapshot.gad7}
              series={trace!.gad7}
            />
            <ComparisonCard
              instrument="RSE"
              label="나에 대한 빛"
              d0={trace!.d0Snapshot.rse}
              current={trace!.currentSnapshot.rse}
              series={trace!.rse}
            />
          </>
        )}

        {/* 디스클레이머 — CLAUDE.md 정신 */}
        <View
          className="mt-6 rounded-xl px-4 py-3 flex-row items-start gap-2"
          style={{ backgroundColor: colors.overlayPurpleSoft }}
        >
          <Icon name="leaf" size={16} color={colors.purple[400]} />
          <Caption className="text-gray-400 flex-1 leading-5">
            결과는 정답이 아니야. 회복은 일직선이 아니라 흐름이야 — 오르내림
            그 자체가 회복의 결이야.
          </Caption>
        </View>

        {/* 척도 출처 — Pfizer/UMD 공식 라이선스 + 한국어 번역 인용 */}
        <Pressable
          onPress={() => router.push('/legal/scales' as Href)}
          accessibilityRole="button"
          accessibilityLabel="이 척도들의 출처 보기"
          className="mt-3 self-start active:opacity-60 px-2 py-1"
        >
          <Caption className="text-gray-600 text-xs underline">
            척도 출처 및 라이선스 보기 ›
          </Caption>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

function EmptyState() {
  return (
    <Card className="p-5 items-start">
      <Icon name="leaf" size={28} color={colors.purple[400]} />
      <Body className="text-gray-200 font-semibold mt-3 mb-1">
        아직 결을 잡을 데이터가 없어
      </Body>
      <Caption className="text-gray-500 leading-5 mb-4">
        첫 측정을 마치면 D+0와 비교해 회복의 결을 볼 수 있어.
        2분이면 끝나.
      </Caption>
      <Pressable
        onPress={() => router.push('/assessments/PHQ9?source=manual' as Href)}
        accessibilityRole="button"
        accessibilityLabel="첫 측정 시작"
        className="rounded-xl px-4 py-3 active:opacity-80"
        style={{ backgroundColor: colors.purple[600] }}
      >
        <Body className="text-white font-semibold">첫 측정 시작</Body>
      </Pressable>
    </Card>
  );
}

interface ComparisonProps {
  instrument: Instrument;
  label: string;
  d0: number | null;
  current: number | null;
  series: TimePoint[];
}

const INSTRUMENT_DESCRIPTION: Partial<Record<Instrument, string>> = {
  PHQ9: '우울 정도를 살펴보는 9문항',
  GAD7: '불안 정도를 살펴보는 7문항',
  RSE: '자존감을 살펴보는 10문항',
};

function ComparisonCard({ instrument, label, d0, current, series }: ComparisonProps) {
  const description = INSTRUMENT_DESCRIPTION[instrument] ?? '';

  if (series.length === 0) {
    return (
      <Pressable
        onPress={() => router.push(`/assessments/${instrument}?source=manual` as Href)}
        accessibilityRole="button"
        accessibilityLabel={`${label} 측정 시작`}
        className="active:opacity-70"
      >
        <Card className="p-4 mb-3 flex-row items-center justify-between">
          <View className="flex-1">
            <Caption className="text-gray-400 font-medium">{label}</Caption>
            <Caption className="text-gray-600 text-xs mt-0.5">{description}</Caption>
            <Body className="text-purple-400 text-sm mt-2 font-medium">지금 시작하기 ›</Body>
          </View>
          <Icon name="chevron-right" size={18} color={colors.gray[600]} />
        </Card>
      </Pressable>
    );
  }

  const currentBand = series[series.length - 1].band;
  const currentMeta = bandMetaphor(instrument, currentBand);
  const d0Band = series[0].band;
  const d0Meta = bandMetaphor(instrument, d0Band);

  // 변화 방향 — PHQ9/GAD7은 *낮을수록* 호전, RSE는 *높을수록* 호전
  const lowerIsBetter = instrument !== 'RSE';
  const delta = (current ?? 0) - (d0 ?? 0);
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  const same = delta === 0;

  return (
    <Card className="p-4 mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Caption className="text-purple-400 font-semibold">{label}</Caption>
          <Caption className="text-gray-600 text-xs mt-0.5">{description}</Caption>
        </View>
        <View
          className="rounded-full px-2.5 py-1"
          style={{
            backgroundColor: same
              ? colors.overlayGrayMuted
              : improved
              ? colors.overlayTealSoft
              : colors.overlayAmberSoft,
          }}
        >
          <Caption
            className="text-xs font-medium"
            style={{
              color: same ? colors.gray[400] : improved ? colors.teal[400] : colors.amber[400],
            }}
          >
            {same ? '비슷한 결' : improved ? '결이 가벼워졌어' : '결이 무거워졌어'}
          </Caption>
        </View>
      </View>

      <View className="flex-row gap-3 mb-3">
        <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: colors.bg }}>
          <Caption className="text-gray-600 text-xs mb-1">처음 결</Caption>
          <Body className="text-gray-300 font-semibold text-sm">{d0Meta.headline}</Body>
        </View>
        <View className="flex-1 rounded-xl px-3 py-3" style={{ backgroundColor: colors.overlayPurpleSoft }}>
          <Caption className="text-purple-400 text-xs mb-1">지금 결</Caption>
          <Body className="text-purple-50 font-semibold text-sm">{currentMeta.headline}</Body>
        </View>
      </View>
      <Caption className="text-gray-500 text-xs leading-5">{currentMeta.subline}</Caption>

      {series.length >= 2 && <TraceLine series={series} accentColor={colors.purple[400]} />}
    </Card>
  );
}

function TraceLine({ series, accentColor }: { series: TimePoint[]; accentColor: string }) {
  const data = series.map((p) => p.rawScore);
  const labels = series.map((_, i) =>
    i === 0 ? '처음' : i === series.length - 1 ? '오늘' : '',
  );
  return (
    <View className="mt-3" pointerEvents="none">
      <LineChart
        data={{ labels, datasets: [{ data }] }}
        width={CHART_WIDTH - 32}
        height={120}
        yAxisInterval={1}
        withVerticalLines={false}
        withHorizontalLines={false}
        withInnerLines={false}
        withOuterLines={false}
        withDots
        withShadow={false}
        // y축 숫자도 숨김 — 점수 노출 차단
        formatYLabel={() => ''}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(127, 119, 221, ${opacity})`,
          labelColor: () => colors.gray[600],
          propsForDots: { r: '3.5', strokeWidth: '2', stroke: accentColor },
        }}
        bezier
        style={{ borderRadius: 12, marginLeft: -16 }}
      />
    </View>
  );
}
