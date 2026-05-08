import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { useQuestionStore, type AnsweredQuestion, type Question } from '@/store/useQuestionStore';
import { fetchAnsweredQuestions } from '@/api/questions';
import { defaultPreviousAnswerFormatter } from '@/components/ui/answerFormatters';
import { useScreenView } from '@/hooks/useScreenView';

// "내가 답한 질문" 모음 화면.
// 정책:
//  · status='answered'만 (shown 제외)
//  · 분석 화면에서 별도 노출되는 pros/cons 카테고리 질문은 제외
//    (사용자: "장점/단점 같은 것들은 안 보여줘도 돼")
//  · 최신순 단일 리스트 (카테고리 그룹·검색 X — 사용자 요청대로 단순)

interface DisplayItem {
  questionId: string;
  questionText: string;
  formattedAnswer: string;
  updatedAt: string;
}

const HIDDEN_CATEGORIES = new Set(['pros', 'cons']);

function buildItems(pool: Question[], answered: Record<string, AnsweredQuestion>): DisplayItem[] {
  const items: DisplayItem[] = [];
  Object.values(answered).forEach((a) => {
    if (a.status !== 'answered') return;
    const q = pool.find((p) => p.id === a.questionId);
    if (!q) return;
    if (q.category && HIDDEN_CATEGORIES.has(q.category)) return;
    const formatted = defaultPreviousAnswerFormatter(a.responseValue);
    if (!formatted) return;
    items.push({
      questionId: a.questionId,
      questionText: q.text,
      formattedAnswer: formatted,
      updatedAt: a.updatedAt,
    });
  });
  // 최신순
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return items;
}

function formatRelativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  const diffMs = now - t;
  const day = 24 * 60 * 60 * 1000;
  if (diffMs < day) return '오늘';
  if (diffMs < 2 * day) return '어제';
  const days = Math.floor(diffMs / day);
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  return `${Math.floor(days / 30)}개월 전`;
}

export default function AnswersScreen() {
  const { userId } = useUserStore();
  const pool = useQuestionStore((s) => s.pool);
  const storeAnswered = useQuestionStore((s) => s.answered);
  const [loading, setLoading] = useState(true);
  const [serverAnswered, setServerAnswered] = useState<Record<string, AnsweredQuestion> | null>(null);

  useScreenView('answers');

  useEffect(() => {
    if (!userId) return;
    fetchAnsweredQuestions(userId)
      .then((rows) => {
        const map: Record<string, AnsweredQuestion> = {};
        rows.forEach((r) => { map[r.questionId] = r; });
        setServerAnswered(map);
      })
      .catch(() => setServerAnswered(null))
      .finally(() => setLoading(false));
  }, [userId]);

  // 서버 데이터 우선, 없으면 스토어 폴백 (오프라인)
  const items = useMemo(() => {
    const source = serverAnswered ?? storeAnswered;
    return buildItems(pool, source);
  }, [pool, storeAnswered, serverAnswered]);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />
        <Heading className="mb-1">내가 답한 질문</Heading>
        <Caption className="text-gray-500 mb-6">
          그동안 답해온 자유 질문들 — 최신순.
        </Caption>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : items.length === 0 ? (
          <Card className="p-5 items-start">
            <Icon name="leaf" size={28} color={colors.purple[400]} />
            <Body className="text-gray-200 font-semibold mt-3 mb-1">
              아직 답한 질문이 없어
            </Body>
            <Caption className="text-gray-500 leading-5">
              일기·분석·나침반에서 답한 질문이 여기 모여.
            </Caption>
          </Card>
        ) : (
          <View className="gap-3">
            {items.map((item) => (
              <Card key={item.questionId} className="p-4">
                <Caption className="text-purple-400 mb-1">
                  {formatRelativeTime(item.updatedAt)}
                </Caption>
                <Body className="text-gray-300 mb-3">{item.questionText}</Body>
                <View
                  className="rounded-xl px-3 py-3"
                  style={{ backgroundColor: colors.overlayPurpleSoft }}
                >
                  <Body className="text-purple-50 leading-relaxed">{item.formattedAnswer}</Body>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
