import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { AnswerTimeline } from '@/components/ui/AnswerTimeline';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { useQuestionStore } from '@/store/useQuestionStore';
import { fetchKnotArchives, type KnotArchiveRow } from '@/api/knotArchive';
import { fetchResponseHistoryByCategory, type ResponseHistoryEntry } from '@/api/questions';
import { pickActiveReasonTimeline } from '@/utils/reasonReflection';

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
  const pool = useQuestionStore((s) => s.pool);
  const [rows, setRows] = useState<KnotArchiveRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tier 2-4: Apple Pay Wallet 카드 스택 — 한 번에 한 사이클만 펼침. 기본 = 최신.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // Phase J — 사이클 타임라인 화면 *상단*에 노출할 회복 서사 시계열.
  // 사이클 경계와 무관하게 reason 카테고리 답변 흐름을 한눈에 — "여러 매듭에 걸쳐
  // 마음이 어떻게 흘러왔는지" 시각화. 변화 없으면 (1건 또는 같은 값) 미렌더.
  const [reasonTimeline, setReasonTimeline] = useState<ReturnType<typeof pickActiveReasonTimeline>>(null);

  useEffect(() => {
    if (!userId) {
      setRows([]);
      return;
    }
    fetchKnotArchives(userId)
      .then((r) => {
        setRows(r);
        setExpandedId(r[0]?.id ?? null); // 최신 사이클 기본 펼침
      })
      .catch((e: Error) => setError(e.message));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetchResponseHistoryByCategory(userId, 'reason')
      .then((h) => setReasonTimeline(pickActiveReasonTimeline(h as ResponseHistoryEntry[])))
      .catch(() => {/* 타임라인 미노출 — 본 화면 영향 없음 */});
  }, [userId]);

  const reasonQuestionText = reasonTimeline
    ? pool.find((q) => q.id === reasonTimeline.questionId)?.text ?? '헤어진 이유, 어떻게 적어왔는지'
    : null;

  return (
    <ScreenWrapper>
      <View style={{ paddingHorizontal: 24, paddingTop: 64 }}>
        <BackHeader />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
      >
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

        {/* Phase J — 사이클 횡단 회복 서사. 매듭이 *최소 1회* 있을 때만 노출.
            매듭 0회 사용자에겐 "아직 매듭이 없어" 안내가 단독으로 보이도록 가드. */}
        {rows !== null && rows.length > 0 && reasonTimeline && reasonQuestionText && (
          <Card className="mb-6">
            <AnswerTimeline questionText={reasonQuestionText} entries={reasonTimeline.entries} />
          </Card>
        )}

        {/* Tier 2-4: 카드 스택 적층 (Apple Pay Wallet) — 사이클이 차곡차곡 쌓인 누적 은유.
            펼친 카드는 L2 서피스로 들어올리고, 접힌 카드는 헤더 띠만 보이며 살짝 겹침.
            "끝이 아닌 챕터" 규칙과 1:1 — 이전 사이클도 사라지지 않고 더미 아래 보존. */}
        {rows !== null && rows.length > 0 && (
          <View>
            {rows.map((row, idx) => (
              <ArchiveCard
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                stacked={idx > 0}
                onToggle={() => setExpandedId((cur) => (cur === row.id ? null : row.id))}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function ArchiveCard({
  row,
  expanded,
  stacked,
  onToggle,
}: {
  row: KnotArchiveRow;
  expanded: boolean;
  /** 첫 카드가 아니면 위 카드 하단에 살짝 겹침 — Wallet처럼 아래(과거) 카드가 위 카드 끝단을 가리는 적층 */
  stacked: boolean;
  onToggle: () => void;
}) {
  const journalCount = (row.summary.journal_count as number) ?? 0;
  const moodAvg = row.summary.mood_avg as number | null;
  const coolingDays = (row.summary.cooling_days as number) ?? null;
  const archivedDate = new Date(row.archivedAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Pressable은 단일 a11y 노드라 자식 텍스트가 label에 병합되지 않음 —
  // 펼침 시 상세(일기 수/유예/온도)를 label에 직접 합성해야 스크린리더가 읽는다.
  const headerLabel = `사이클 ${row.cycleIndex}, ${archivedDate}, ${row.knotLabel}`;
  const detailLabel =
    `${headerLabel}, 일기 ${journalCount}개, ` +
    (coolingDays != null ? `${coolingDays}일 유예` : '유예 정보 없음') +
    (moodAvg != null ? `, 평균 감정 온도 ${moodAvg.toFixed(1)}도` : '');

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      accessibilityState={{ expanded }}
      accessibilityLabel={expanded ? detailLabel : headerLabel}
      accessibilityHint={expanded ? '접으려면 두 번 탭해' : '자세히 보려면 두 번 탭해'}
      className="active:opacity-80 rounded-2xl p-4"
      style={{
        // 펼침 = 더미에서 들어올린 L2 (zIndex로 아래 카드 위에 떠 보임), 접힘 = 더미 속 L1
        backgroundColor: expanded ? colors.surfaceElevated : colors.surface,
        borderWidth: 1,
        borderColor: expanded ? colors.borderPurpleSoft : colors.border,
        marginTop: stacked ? -6 : 0,
        zIndex: expanded ? 1 : 0,
      }}
    >
      <View className="flex-row items-center gap-2">
        <Icon name="link" size={18} color={expanded ? colors.purple[400] : colors.gray[500]} />
        <Body className="font-medium">사이클 {row.cycleIndex}</Body>
        <Caption className="text-gray-500">· {archivedDate}</Caption>
        <View className="ml-auto">
          <Caption className="text-gray-500">{row.knotLabel}</Caption>
        </View>
      </View>
      {expanded && (
        <View className="gap-1.5 mt-3">
          <Caption className="text-gray-400">
            일기 {journalCount}개 · {coolingDays != null ? `${coolingDays}일 유예` : '유예 정보 없음'}
          </Caption>
          {moodAvg != null && (
            <Caption className="text-gray-400">
              평균 감정 온도 {moodAvg.toFixed(1)}°
            </Caption>
          )}
        </View>
      )}
    </Pressable>
  );
}
