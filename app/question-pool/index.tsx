import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { QuestionPoolCard } from '@/components/ui/QuestionPoolCard';
import { useStaggerEntrance } from '@/hooks/useStaggerEntrance';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useQuestionStore, type Question } from '@/store/useQuestionStore';
import type { PersonaCode } from '@/utils/personaClassifier';
import {
  fetchAnsweredQuestions,
  upsertQuestionResponse,
} from '@/api/questions';
import {
  getQuestionBooster,
  isQuestionBlocked,
} from '@/constants/personaQuestionWeights';
import { getKnotPolicy } from '@/utils/knotPolicy';
import { useScreenView } from '@/hooks/useScreenView';

// "질문통" — 미답변 질문 풀에서 사용자가 골라 답하는 화면.
//
// 시각 위계:
//  Hero(상위 1~2개 booster 최상위) → Tailored row → Standard row 3-tier.
//  context별 색·아이콘 매핑(constants/questionContextTheme.ts) — 단조로움 해소.
//
// 정책:
//  · 미답변만 노출 / pros·cons 제외 / 페르소나 차단(KNOT_FORBIDDEN 등) 제외
//  · 매듭 권유 비허용 페르소나(P03·P11·P16·P19)는 graduation 질문 hero 승격 금지
//    (row 노출은 자발적 선택이라 절대 규칙상 허용)
//  · is_active = false 제외

const HIDDEN_CATEGORIES = new Set(['pros', 'cons']);
const TOP_RECOMMEND_COUNT = 3;
const HERO_COUNT_WHEN_TAILORED = 2;

interface SectionItem {
  question: Question;
  booster: number;
  baseScore: number;
}

/**
 * graduation hero 가드 — 매듭 권유 비허용 페르소나는 graduation 질문을 hero로
 * 승격 금지(시각적 권유로 오인 위험). row 노출은 자발적 선택이라 허용.
 * knotPolicy.triggerAllowed가 SSOT.
 */
function isHeroEligible(q: Question, persona: PersonaCode | null): boolean {
  if (!q.context.includes('graduation')) return true;
  return getKnotPolicy(persona).triggerAllowed;
}

function buildSections(
  pool: Question[],
  answeredIds: Set<string>,
  persona: PersonaCode | null,
): { hero: SectionItem[]; tailored: SectionItem[]; others: SectionItem[] } {
  const tailored: SectionItem[] = [];
  const others: SectionItem[] = [];

  pool.forEach((q) => {
    if (!q.isActive) return;
    if (answeredIds.has(q.id)) return;
    if (q.category && HIDDEN_CATEGORIES.has(q.category)) return;
    if (isQuestionBlocked(persona as never, q.id)) return;

    const booster = getQuestionBooster(persona as never, q.id);
    const baseScore = q.weight + 5;
    const item: SectionItem = { question: q, booster, baseScore };

    if (booster > 0) tailored.push(item);
    else others.push(item);
  });

  const sortByScore = (a: SectionItem, b: SectionItem) =>
    (b.baseScore + b.booster) - (a.baseScore + a.booster);
  tailored.sort(sortByScore);
  others.sort(sortByScore);

  // Hero 승격 — 상위 tailored에서 N개 splice (graduation hero 가드 적용)
  const hero: SectionItem[] = [];
  let i = 0;
  while (hero.length < HERO_COUNT_WHEN_TAILORED && i < tailored.length) {
    if (isHeroEligible(tailored[i].question, persona)) {
      hero.push(tailored.splice(i, 1)[0]);
    } else {
      i += 1;
    }
  }

  // tailored가 비었거나 hero가 0개면 others 중 weight≥9 1개를 hero로 fallback
  if (hero.length === 0) {
    const fallbackIdx = others.findIndex(
      (it) => it.question.weight >= 9 && isHeroEligible(it.question, persona),
    );
    if (fallbackIdx >= 0) hero.push(...others.splice(fallbackIdx, 1));
  }

  return { hero, tailored, others };
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
      .catch(() => {/* fail open */})
      .finally(() => setLoading(false));
  }, [userId]);

  const { hero, tailored, others } = useMemo(
    () => buildSections(pool, answeredIds, personaPrimary),
    [pool, answeredIds, personaPrimary],
  );

  const recommendedIds = useMemo(
    () => new Set(others.slice(0, TOP_RECOMMEND_COUNT).map((i) => i.question.id)),
    [others],
  );

  const totalRemaining = hero.length + tailored.length + others.length;

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

  function getResponseValue(): unknown | null {
    if (!activeQuestion) return null;
    if (activeQuestion.displayType === 'boolean') return answerBoolean;
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
      setAnsweredIds((prev) => {
        const next = new Set(prev);
        next.add(activeQuestion.id);
        return next;
      });
      closeAnswerModal();
    } catch {
      /* 저장 실패 시 모달 유지 */
    } finally {
      setSaving(false);
    }
  }

  // stagger index — 카드+섹션 헤더 위→아래 누적
  let staggerCursor = 0;
  const nextStagger = () => staggerCursor++;

  return (
    <ScreenWrapper>
      <View style={{ paddingHorizontal: 24, paddingTop: 56 }}>
        <BackHeader />
      </View>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
          <View style={{ flex: 1 }}>
            <Caption className="mb-1">기록</Caption>
            <Display className="mb-2">질문통</Display>
          </View>
          {!loading && totalRemaining > 0 && (
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: radius.pill,
                backgroundColor: colors.overlayPurpleSoft,
                marginBottom: 8,
              }}
            >
              <Caption
                style={{
                  color: colors.purple[400],
                  fontSize: 12,
                  fontWeight: '700',
                }}
              >
                미답변 {totalRemaining}개
              </Caption>
            </View>
          )}
        </View>
        <Body className="text-gray-400 mb-8">
          준비된 질문 중에서 골라 답해봐. 답한 건 [답한 질문]에 모여.
        </Body>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : totalRemaining === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Hero */}
            {hero.length > 0 && (
              <View style={{ gap: 12, marginBottom: 28 }}>
                {hero.map((item) => (
                  <QuestionPoolCard
                    key={item.question.id}
                    question={item.question}
                    variant="hero"
                    recommended
                    staggerIndex={nextStagger()}
                    onPress={() => openAnswerModal(item.question)}
                  />
                ))}
              </View>
            )}

            {/* 너에게 맞춤 */}
            {tailored.length > 0 && (
              <View style={{ marginBottom: 28 }}>
                <SectionHeader
                  iconName="leaf"
                  iconColor={colors.purple[400]}
                  iconBg={colors.overlayPurpleSoft}
                  title="너에게 맞춤"
                  count={tailored.length}
                  staggerIndex={nextStagger()}
                />
                <View style={{ gap: 12, marginTop: 14 }}>
                  {tailored.map((item) => (
                    <QuestionPoolCard
                      key={item.question.id}
                      question={item.question}
                      variant="tailored"
                      staggerIndex={nextStagger()}
                      onPress={() => openAnswerModal(item.question)}
                    />
                  ))}
                </View>
              </View>
            )}

            {/* 더 깊이 가보기 */}
            {others.length > 0 && (
              <View>
                <SectionHeader
                  iconName="search"
                  iconColor={colors.purple[400]}
                  iconBg={colors.overlayPurpleSoft}
                  title="더 깊이 가보기"
                  count={others.length}
                  staggerIndex={nextStagger()}
                />
                <View style={{ gap: 12, marginTop: 14 }}>
                  {others.map((item) => (
                    <QuestionPoolCard
                      key={item.question.id}
                      question={item.question}
                      variant="standard"
                      recommended={recommendedIds.has(item.question.id)}
                      staggerIndex={nextStagger()}
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

// ---------------------------------------------------------------------------
// SectionHeader — 24pt 원형 아이콘 + 18pt 제목 + 우측 카운트 caption.
// records 패턴과 동일 언어로 시각 일관성.
// ---------------------------------------------------------------------------

interface SectionHeaderProps {
  iconName: 'leaf' | 'search';
  iconColor: string;
  iconBg: string;
  title: string;
  count: number;
  staggerIndex: number;
}

function SectionHeader({ iconName, iconColor, iconBg, title, count, staggerIndex }: SectionHeaderProps) {
  const enterStyle = useStaggerEntrance(Math.min(staggerIndex, 8));
  return (
    <Animated.View
      style={[
        { flexDirection: 'row', alignItems: 'center', gap: 10 },
        enterStyle,
      ]}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name={iconName} size={14} color={iconColor} />
      </View>
      <Heading
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.white,
        }}
      >
        {title}
      </Heading>
      <View style={{ flex: 1 }} />
      <Caption style={{ color: colors.gray[600], fontSize: 12, fontWeight: '600' }}>
        {count}
      </Caption>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Empty state — 64pt Sparkles 원형 배지 + heading + CTA. 페르소나 가드 노출 X.
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <View style={{ alignItems: 'center', paddingTop: 32, paddingBottom: 24 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: colors.overlayPurpleSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Icon name="sparkles" size={28} color={colors.purple[400]} />
      </View>
      <Heading style={{ textAlign: 'center', marginBottom: 8 }}>
        이번에 답할 질문은 다 봤어
      </Heading>
      <Body
        style={{
          textAlign: 'center',
          color: colors.gray[400],
          lineHeight: 22,
          marginBottom: 24,
          paddingHorizontal: 16,
        }}
      >
        그동안 답한 질문은 [답한 질문]에 모여 있어.
      </Body>
      <View style={{ width: '100%', maxWidth: 320 }}>
        <PrimaryButton
          label="답한 질문 보러가기"
          onPress={() => router.push('/answers' as never)}
        />
      </View>
      <Pressable
        onPress={() => router.replace('/(tabs)' as never)}
        accessibilityRole="button"
        accessibilityLabel="홈으로"
        hitSlop={8}
        className="active:opacity-60 mt-4"
      >
        <Caption style={{ color: colors.gray[600] }}>홈으로 ›</Caption>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// AnswerModal — 기존 동작 그대로 (boolean / free_text 분기). 디자인 미변경.
// ---------------------------------------------------------------------------

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
                fontFamily: 'Pretendard',
                minHeight: 100,
                backgroundColor: colors.bg,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: radius.sm,
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
