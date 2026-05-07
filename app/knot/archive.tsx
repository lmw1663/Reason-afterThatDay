import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { fetchKnotArchives, type KnotArchiveRow } from '@/api/knotArchive';

/**
 * 매듭 사이클 타임라인 — F-10
 *
 * 사용자가 매듭을 지을 때마다 knot_archive에 사이클 스냅샷이 저장된다.
 * 본 화면은 그 스냅샷들을 *시간순 역순*(최신 cycle 위)으로 나열해 자기 회복 서사를 보여준다.
 *
 * 가역성 H1: 매듭은 *끝*이 아닌 *사이클의 한 챕터*. 여러 cycle이 누적되어도 *재발/실패*가
 * 아닌 자기 패턴 인식의 자료. P06(반복 사이클)에 특히 유의미.
 *
 * 빈 상태: 매듭 경험 없으면 안내 카드 + 홈으로 안내.
 */
export default function KnotArchiveScreen() {
  const userId = useUserStore((s) => s.userId);
  const [rows, setRows] = useState<KnotArchiveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      return;
    }
    fetchKnotArchives(userId)
      .then(setRows)
      .catch((e: Error) => setError(e.message));
  }, [userId]);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
      >
        <BackHeader />
        <Caption className="mb-2">기록 · 사이클 타임라인</Caption>
        <Display className="mb-2">매듭의 흔적</Display>
        <Body className="text-gray-400 mb-8">
          지나온 사이클들이 차곡차곡 쌓여 있어. 반복도, 변화도 모두 너의 회복 서사야.
        </Body>

        {rows === null && !error && (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        )}

        {error && (
          <Card variant="subtle" accent="amber" className="mb-3">
            <Caption className="text-amber-400">불러오는 중 오류가 났어. 잠시 후 다시 시도해줄래?</Caption>
          </Card>
        )}

        {rows !== null && rows.length === 0 && !error && (
          <Card variant="subtle" accent="purple">
            <Heading className="mb-2">아직 매듭이 없어</Heading>
            <Body className="text-gray-400 leading-relaxed">
              매듭은 *끝이 아니야*. 사이클의 한 챕터를 닫는 일이야.{'\n'}
              때가 되면 자연스럽게 권유가 올 거야.
            </Body>
          </Card>
        )}

        {rows !== null && rows.length > 0 && (
          <View className="gap-3">
            {rows.map((row) => (
              <ArchiveCard key={row.id} row={row} />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function ArchiveCard({ row }: { row: KnotArchiveRow }) {
  const journalCount = (row.summary.journal_count as number) ?? 0;
  const moodAvg = row.summary.mood_avg as number | null;
  const coolingDays = (row.summary.cooling_days as number) ?? null;
  const archivedDate = new Date(row.archivedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <Icon name="link" size={18} color={colors.purple[400]} />
        <Body className="font-medium">사이클 {row.cycleIndex}</Body>
        <View className="ml-auto">
          <Caption className="text-gray-500">{row.knotLabel}</Caption>
        </View>
      </View>
      <Caption className="text-gray-500 mb-3">{archivedDate}</Caption>
      <View className="gap-1.5">
        <Caption className="text-gray-400">
          일기 {journalCount}개 · {coolingDays != null ? `${coolingDays}일 유예` : '유예 정보 없음'}
        </Caption>
        {moodAvg != null && (
          <Caption className="text-gray-400">
            평균 감정 온도 {moodAvg.toFixed(1)}°
          </Caption>
        )}
      </View>
    </Card>
  );
}
