import { useState, useEffect, useRef } from 'react';
import { Pressable, View, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Caption, Heading } from '@/components/ui/Typography';
import { useJournalQueue } from '@/hooks/useJournalQueue';
import { useQuestionStore } from '@/store/useQuestionStore';
import type {
  QueueItem,
  QueueAnswerPayload,
  JournalMemoryCategory,
} from '@/utils/journalQueueRouter';
import type { Direction } from '@/store/useJournalStore';
import type { ReflectionCategory } from '@/api/selfReflections';
import { colors } from '@/constants/colors';

const ABOUT_ME_PROMPT: Record<ReflectionCategory, string> = {
  self_love: '오늘 너 자신을 위해 한 가지 했던 게 있어?',
  strengths: '오늘 발견한 너의 작은 장점이 있다면?',
  self_care_in_relationship: '관계 안에서 너를 잃지 않았던 순간이 있다면?',
  self_care_alone: '혼자 있는 너를 돌보는 방법 한 가지가 있다면?',
  love_self: '지금 너 자신에게 해주고 싶은 말이 있다면?',
  ideal_match: '네가 진짜 원하는 관계는 어떤 모습일까?',
  reality_check: '오늘 너에 대해 *사실*만 적는다면?',
  body: '오늘 몸이 너에게 어떤 신호를 보냈어?',
  needs: '오늘 너에게 가장 필요했던 한 가지가 뭐야?',
  identity: '너는 어떤 사람이라고 느껴? 한 줄로.',
};

function getMemoryPrompt(c: JournalMemoryCategory): string {
  switch (c) {
    case 'happy':   return '함께한 시간 중 *행복*했던 순간 하나가 떠올라?';
    case 'miss':    return '지금도 *그리운* 게 있다면 한 가지만.';
    case 'painful': return '아팠던 순간 중 한 가지를 꺼내본다면?';
    case 'growth':  return '이 관계에서 네가 *성장*한 부분이 있다면?';
  }
}

function getPromptHeader(item: QueueItem): string {
  switch (item.kind) {
    case 'smartQ':
      return item.smartQ?.text ?? '오늘 하루 어떤 순간이 기억에 남아?';
    case 'aboutMe':
      return item.aboutMe ? ABOUT_ME_PROMPT[item.aboutMe] : '너에 대해 한 가지 적어볼래?';
    case 'memory':
      return item.memory ? getMemoryPrompt(item.memory) : '추억 중 하나가 떠올라?';
    case 'prosCons':
      return item.prosCons === 'cons'
        ? '오늘 떠오른 상대의 *단점* 한 가지가 있다면?'
        : '오늘 떠오른 상대의 *장점* 한 가지가 있다면?';
  }
}

function getPlaceholder(item: QueueItem): string {
  switch (item.kind) {
    case 'smartQ':   return '솔직하게 써봐. 판단 없어.';
    case 'aboutMe':  return '한 줄이어도 괜찮아.';
    case 'memory':   return '짧게 한 장면만.';
    case 'prosCons': return '미화 없이, 떠오르는 그대로.';
  }
}

function buildPayload(item: QueueItem, text: string): QueueAnswerPayload {
  return {
    id: item.id,
    kind: item.kind,
    smartQId: item.smartQ?.id,
    aboutMeCategory: item.aboutMe,
    memoryCategory: item.memory,
    prosCons: item.prosCons,
    text,
  };
}

export default function JournalQuestionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    physicalSignals: string;
    affectionLevel: string;
    freeText: string;
    direction: string;
  }>();
  const direction = (params.direction ?? 'undecided') as Direction;
  const queue = useJournalQueue(direction);
  const { markAnswered: markQuestionAnswered } = useQuestionStore();

  const [text, setText] = useState('');
  const [answers, setAnswers] = useState<QueueAnswerPayload[]>([]);
  // navigated 가드 — useRef로 변경해 useEffect 다중 발사 + setState 비동기 race 차단 (P1-3)
  const navigatedRef = useRef(false);
  // 더블탭/연타 직렬화 가드 (P0-3, P1-1)
  const submittingRef = useRef(false);

  // 큐가 비어 있거나 끝나면 response로 이동 (collected answers 동봉)
  // deps에서 params 객체 제거 — useLocalSearchParams는 매 렌더 새 객체 반환 가능 (P1-3)
  useEffect(() => {
    if (navigatedRef.current) return;
    if (!queue.ready) return;
    if (!queue.done) return;

    navigatedRef.current = true;
    // smartQ 답변이 있으면 questionAnswer로 backcompat (response.tsx의 freeText 폴백 경로)
    const smartQAnswer = answers.find((a) => a.kind === 'smartQ')?.text ?? '';
    router.replace({
      pathname: '/journal/response',
      params: {
        ...params,
        questionAnswer: smartQAnswer,
        queueAnswers: JSON.stringify(answers),
      },
    });
    // params는 의도적으로 deps 제외 — 한 번만 navigate (navigatedRef 가드와 함께)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queue.ready, queue.done, answers]);

  // ready 전 또는 done 직후(navigate 대기 중) → "잠시만…" (빈 큐도 done=true → useEffect로 즉시 redirect)
  if (!queue.ready || !queue.current) {
    return (
      <ScreenWrapper>
        <View className="flex-1 px-6 pt-14">
          <BackHeader />
          <Caption className="mb-2">이별 일기</Caption>
          <Heading className="mb-6 leading-snug">잠시만…</Heading>
        </View>
      </ScreenWrapper>
    );
  }

  const item = queue.current;
  const header = getPromptHeader(item);
  const placeholder = getPlaceholder(item);

  function handleNext() {
    if (submittingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    submittingRef.current = true;
    setText('');
    setAnswers((prev) => [...prev, buildPayload(item, trimmed)]);
    if (item.kind === 'smartQ' && item.smartQ) {
      markQuestionAnswered(item.smartQ.id, trimmed);
    }
    queue.markAnswered();
    setTimeout(() => {
      submittingRef.current = false;
    }, 0);
  }

  async function handleSkip() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setText('');
    try {
      await queue.markSkipped();
    } finally {
      setTimeout(() => {
        submittingRef.current = false;
      }, 0);
    }
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">이별 일기</Caption>

        <Heading className="mb-6 leading-snug">{header}</Heading>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={placeholder}
          placeholderTextColor={colors.gray[600]}
          multiline
          autoFocus
          accessibilityLabel={header}
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 160 }}
        />
      </View>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton label="다음" onPress={handleNext} disabled={!text.trim()} />
        {/* "다음에": 작은 회색 텍스트 링크 — 큐 항목 모두 선택형. 단일 primary CTA 원칙 유지.
            정책: AsyncStorage에 KST 자정 anchor로 누적, 다음날 우선노출 (useJournalQueue) */}
        <Pressable
          onPress={handleSkip}
          accessibilityRole="button"
          accessibilityLabel="다음에 답할게"
          hitSlop={8}
          className="active:opacity-60"
        >
          <Caption className="text-center text-gray-500 py-3">다음에 →</Caption>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}
