import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useQuestionStore, type Question } from '@/store/useQuestionStore';
import {
  fetchAnsweredQuestions,
  upsertQuestionResponse,
} from '@/api/questions';
import {
  getQuestionBooster,
  isQuestionBlocked,
} from '@/constants/personaQuestionWeights';
import { useScreenView } from '@/hooks/useScreenView';

// "질문통" — 사용자가 풀의 미답변 질문을 둘러보고 직접 골라서 답하는 화면.
//
// 시그니처(사용자 결정):
//  · 페르소나 booster 적용된 질문은 "너에게 맞춤" 섹션 상단 고정
//  · 시스템 추천 점수 상위는 "추천" 배지
//  · 그 외 일반 질문은 별도 섹션
//
// 정책:
//  · 미답변(answered Map에 없는 것)만 노출
//  · pros/cons 카테고리 제외 (분석 화면 별도 처리)
//  · 페르소나 차단 질문(KNOT_FORBIDDEN 등) 제외
//  · is_active = false 제외
//
// 답변: 카드 탭 → 모달에서 free_text 입력 → 저장 → 카드 사라짐

const HIDDEN_CATEGORIES = new Set(['pros', 'cons']);
const TOP_RECOMMEND_COUNT = 3;

interface SectionItem {
  question: Question;
  booster: number;
  baseScore: number;
}

function buildSections(
  pool: Question[],
  answeredIds: Set<string>,
  persona: string | null,
): { tailored: SectionItem[]; others: SectionItem[] } {
  const tailored: SectionItem[] = [];
  const others: SectionItem[] = [];

  pool.forEach((q) => {
    if (!q.isActive) return;
    if (answeredIds.has(q.id)) return;
    if (q.category && HIDDEN_CATEGORIES.has(q.category)) return;
    if (isQuestionBlocked(persona as never, q.id)) return;

    const booster = getQuestionBooster(persona as never, q.id);
    const baseScore = q.weight + 5; // 모두 미답변이라 +5 적용
    const item: SectionItem = { question: q, booster, baseScore };

    if (booster > 0) tailored.push(item);
    else others.push(item);
  });

  // 점수 내림차순 정렬 (booster 포함)
  const sortByScore = (a: SectionItem, b: SectionItem) =>
    (b.baseScore + b.booster) - (a.baseScore + a.booster);
  tailored.sort(sortByScore);
  others.sort(sortByScore);

  return { tailored, others };
}

export default function QuestionPoolScreen() {
  const { userId } = useUserStore();
  const personaPrimary = usePersonaStore((s) => s.primary);
  const pool = useQuestionStore((s) => s.pool);

  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [answerBoolean, setAnswerBoolean] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  useScreenView('question_pool');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchAnsweredQuestions(userId)
      .then((rows) => {
        const ids = new Set<string>();
        rows.forEach((r) => {
          if (r.status === 'answered') ids.add(r.questionId);
        });
        setAnsweredIds(ids);
      })
      .catch(() => {/* fail open — 빈 set */})
      .finally(() => setLoading(false));
  }, [userId]);

  const { tailored, others } = useMemo(
    () => buildSections(pool, answeredIds, personaPrimary),
    [pool, answeredIds, personaPrimary],
  );

  // 일반 섹션 상위 N개에 "추천" 배지
  const recommendedIds = useMemo(
    () => new Set(others.slice(0, TOP_RECOMMEND_COUNT).map((i) => i.question.id)),
    [others],
  );

  function openAnswerModal(q: Question) {
    setActiveQuestion(q);
    setAnswerText('');
    setAnswerBoolean(null);
  }

  function closeAnswerModal() {
    setActiveQuestion(null);
    setAnswerText('');
    setAnswerBoolean(null);
  }

  // display_type별 응답값·유효성 분기.
  // boolean → true|false, 그 외(choice w/o options 포함) → free_text fallback.
  function getResponseValue(): unknown | null {
    if (!activeQuestion) return null;
    if (activeQuestion.displayType === 'boolean') {
      return answerBoolean;
    }
    const trimmed = answerText.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  async function handleSave() {
    if (!activeQuestion || !userId || saving) return;
    const value = getResponseValue();
    if (value === null) return;
    setSaving(true);
    try {
      await upsertQuestionResponse({
        userId,
        questionId: activeQuestion.id,
        responseType: activeQuestion.displayType ?? 'free_text',
        responseValue: value,
        status: 'answered',
      });
      // 로컬에서 답변 ID 추가 — 카드 즉시 사라짐
      setAnsweredIds((prev) => {
        const next = new Set(prev);
        next.add(activeQuestion.id);
        return next;
      });
      closeAnswerModal();
    } catch {
      // 저장 실패 시 모달 유지 — 사용자가 다시 시도
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />
        <Heading className="mb-1">질문통</Heading>
        <Caption className="text-gray-500 mb-6">
          미리 준비된 질문 중에서 골라 답해봐. 답한 건 [내가 답한 질문]에 모여.
        </Caption>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : tailored.length === 0 && others.length === 0 ? (
          <Card className="p-5 items-start">
            <Icon name="leaf" size={28} color={colors.purple[400]} />
            <Body className="text-gray-200 font-semibold mt-3 mb-1">
              지금은 새로 답할 질문이 없어
            </Body>
            <Caption className="text-gray-500 leading-5">
              모든 질문에 답했거나 페르소나 가드로 잠긴 상태야.
            </Caption>
          </Card>
        ) : (
          <>
            {tailored.length > 0 && (
              <View className="mb-6">
                <View className="flex-row items-center gap-2 mb-3">
                  <Icon name="leaf" size={16} color={colors.purple[400]} />
                  <Caption className="text-purple-400 font-semibold">너에게 맞춤</Caption>
                </View>
                <View className="gap-3">
                  {tailored.map((item) => (
                    <QuestionCard
                      key={item.question.id}
                      question={item.question}
                      tailored
                      onPress={() => openAnswerModal(item.question)}
                    />
                  ))}
                </View>
              </View>
            )}

            {others.length > 0 && (
              <View>
                <Caption className="text-gray-500 font-semibold mb-3">
                  다른 질문
                </Caption>
                <View className="gap-3">
                  {others.map((item) => (
                    <QuestionCard
                      key={item.question.id}
                      question={item.question}
                      recommended={recommendedIds.has(item.question.id)}
                      onPress={() => openAnswerModal(item.question)}
                    />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <AnswerModal
        question={activeQuestion}
        text={answerText}
        onChangeText={setAnswerText}
        booleanValue={answerBoolean}
        onChangeBoolean={setAnswerBoolean}
        onClose={closeAnswerModal}
        onSave={handleSave}
        saving={saving}
        canSave={getResponseValue() !== null}
      />
    </ScreenWrapper>
  );
}

interface QuestionCardProps {
  question: Question;
  tailored?: boolean;
  recommended?: boolean;
  onPress: () => void;
}

function QuestionCard({ question, tailored, recommended, onPress }: QuestionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${question.text} — 답하기`}
      className="active:opacity-80"
    >
      <Card className="p-4">
        <View className="flex-row items-start gap-3">
          <View className="flex-1">
            {(tailored || recommended) && (
              <View className="flex-row gap-2 mb-2">
                {tailored && (
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: colors.overlayPurpleSoft }}
                  >
                    <Caption className="text-purple-400 text-xs font-medium">너에게 맞춤</Caption>
                  </View>
                )}
                {recommended && (
                  <View
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: colors.overlayTealSoft }}
                  >
                    <Caption className="text-teal-400 text-xs font-medium">추천</Caption>
                  </View>
                )}
              </View>
            )}
            <Body className="text-gray-200 leading-relaxed">{question.text}</Body>
          </View>
          <Icon name="chevron-right" size={18} color={colors.gray[600]} />
        </View>
      </Card>
    </Pressable>
  );
}

interface AnswerModalProps {
  question: Question | null;
  text: string;
  onChangeText: (s: string) => void;
  booleanValue: boolean | null;
  onChangeBoolean: (v: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
}

function AnswerModal({
  question, text, onChangeText, booleanValue, onChangeBoolean,
  onClose, onSave, saving, canSave,
}: AnswerModalProps) {
  const isBoolean = question?.displayType === 'boolean';

  return (
    <Modal
      visible={!!question}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: colors.overlayBackdropDark }}
        onPress={onClose}
      >
        <Pressable
          className="w-full rounded-2xl p-6"
          style={{ backgroundColor: colors.surface }}
          onPress={(e) => e.stopPropagation()}
        >
          <Heading className="mb-4">{question?.text}</Heading>

          {isBoolean ? (
            <View className="flex-row gap-3 mb-4">
              {([
                { v: true, label: '그래' },
                { v: false, label: '아니야' },
              ] as const).map(({ v, label }) => {
                const selected = booleanValue === v;
                return (
                  <Pressable
                    key={label}
                    onPress={() => onChangeBoolean(v)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={label}
                    className="flex-1 rounded-xl py-4 items-center active:opacity-80"
                    style={{
                      backgroundColor: selected ? colors.purple[600] : colors.bg,
                      borderWidth: 1,
                      borderColor: selected ? colors.purple[600] : colors.border,
                    }}
                  >
                    <Body
                      className="font-semibold"
                      style={{ color: selected ? '#FFFFFF' : colors.gray[400] }}
                    >
                      {label}
                    </Body>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <TextInput
              value={text}
              onChangeText={onChangeText}
              placeholder="솔직하게 적어봐..."
              placeholderTextColor={colors.gray[600]}
              multiline
              autoFocus
              accessibilityLabel="답변 입력"
              className="text-white text-base leading-relaxed mb-4"
              style={{
                minHeight: 100,
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 12,
                padding: 12,
              }}
            />
          )}

          <PrimaryButton
            label={saving ? '저장 중...' : '저장하기'}
            onPress={onSave}
            disabled={!canSave || saving}
            loading={saving}
          />
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="닫기"
            hitSlop={8}
            className="active:opacity-60"
          >
            <Caption className="text-center text-gray-500 py-3">닫기</Caption>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
