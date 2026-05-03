import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { shouldShowIntrusiveTrend } from '@/constants/personaBranches';
import { getIntrusiveMemoryTrend } from '@/api/intrusiveMemory';

/**
 * [기록] 탭 — A-3
 *
 * 일기·회복 곡선·추억 archive를 한 곳에 모아 보는 화면.
 * 본 placeholder는 진입 카드만 두고, 본 구현은 다음 단계에서 채운다:
 *  - 일기 history는 기존 /journal/history로 redirect
 *  - 회복 곡선 / 사이클 타임라인(P06)은 Phase C
 *  - 추억은 기존 /memories
 */
export default function RecordsScreen() {
  const { userId } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const showIntrusiveTrend = shouldShowIntrusiveTrend(personaPrimary);

  // C-2-G-7b: P09 떠올랐어 카운터·추세 (헌신 소진형 회복 진전 시각화)
  const [trend, setTrend] = useState<{ recent: number; previous: number } | null>(null);
  useEffect(() => {
    if (!userId || !showIntrusiveTrend) return;
    void getIntrusiveMemoryTrend(userId, 7)
      .then(setTrend)
      .catch(() => {/* fail open — 위젯 미노출 */});
  }, [userId, showIntrusiveTrend]);

  return (
    <ScreenWrapper>
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
          <Card className="p-4 mb-3">
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

        <View className="gap-3">
          <RecordCard
            icon="pen"
            title="일기 모아보기"
            subtitle="오늘까지 적은 일기"
            onPress={() => router.push('/journal/history' as never)}
          />
          <RecordCard
            icon="archive"
            title="추억"
            subtitle="사진·메시지·장소 정리"
            onPress={() => router.push('/memories' as never)}
          />
          <RecordCard
            icon="chart"
            title="회복 곡선"
            subtitle="감정 온도가 변해온 모습"
            onPress={() => {/* Phase C에서 /recovery-trace 화면 신설 후 연결 */}}
            comingSoon
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

interface RecordCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  comingSoon?: boolean;
}

function RecordCard({ icon, title, subtitle, onPress, comingSoon }: RecordCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: comingSoon }}
      disabled={comingSoon}
      className="active:opacity-80"
      style={{ opacity: comingSoon ? 0.5 : 1 }}
    >
      <Card className="flex-row items-center gap-4 p-4">
        <Icon name={icon} size={22} color={colors.purple[400]} />
        <View className="flex-1">
          <Body className="font-medium">{title}</Body>
          <Caption className="text-gray-500 mt-0.5">
            {comingSoon ? '준비 중' : subtitle}
          </Caption>
        </View>
        {!comingSoon ? <Icon name="chevron-right" size={18} color={colors.gray[600]} /> : null}
      </Card>
    </Pressable>
  );
}
