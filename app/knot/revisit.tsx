import { useCallback, useEffect, useState } from 'react';
import { BackHandler, View, ActivityIndicator } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { markRevisitCompleted, markRevisitTriggered } from '@/api/knotRevisit';
import type { RitualType } from '@/utils/knotRevisit';

/**
 * 회상 의식 화면 — F-9
 *
 * 매듭 완료 후 D+N 도달 시 발화. 페르소나별 컨텐츠는 ritualType으로 분기:
 *   - d30_revisit / d60_revisit: P05·P14 — 그때의 결정을 다시 들여다보기
 *   - d30_cycle_review:          P06    — 이번 사이클은 지난번이랑 뭐가 달랐는지
 *
 * 진입 시 markRevisitTriggered, 완료 시 markRevisitCompleted. 둘 다 실패 시 warn 후 진행.
 *
 * 본 화면은 *회상*의 출발점만 — 본격적 회고 글쓰기 인터페이스는 향후 PR에서 일기 미니 모드와
 * 통합하거나 전용 회고 일기 카테고리로 분리.
 */

interface RitualCopy {
  caption: string;
  heading: string;
  body: string;
  buttonLabel: string;
}

const RITUAL_COPY: Record<RitualType, RitualCopy> = {
  d30_revisit: {
    caption: '한 달이 지났어',
    heading: '그때의 결정을 다시 들여다볼래?',
    body:
      '결정 직후의 너와 한 달 뒤의 너는 같은 풍경을 다르게 볼 수 있어.\n' +
      '바뀐 게 있어도, 그대로여도 *둘 다 진짜*야.',
    buttonLabel: '오늘의 일기로 돌아볼게',
  },
  d60_revisit: {
    caption: '두 달이 지났어',
    heading: '한 번 더 만나볼게',
    body:
      '두 달 전의 결정과 지금의 너 사이에 다리를 놓아볼래.\n' +
      '*결론*이 아니어도 괜찮고, *답*이 아니어도 괜찮아.',
    buttonLabel: '오늘의 일기로 돌아볼게',
  },
  d30_cycle_review: {
    caption: '한 주가 지났어',
    heading: '이번 사이클은 어땠어?',
    body:
      '지난번이랑 비교하면 뭐가 달랐을까.\n' +
      '같았어도, 달랐어도 *그게 너의 패턴이야*. 패턴을 보는 것 자체가 변화의 시작이야.',
    buttonLabel: '오늘의 일기로 돌아볼게',
  },
};

export default function KnotRevisitScreen() {
  const params = useLocalSearchParams<{ id?: string; ritualType?: RitualType }>();
  const { daysElapsed } = useUserStore();
  const [completing, setCompleting] = useState(false);

  const ritualType = (params.ritualType ?? 'd30_revisit') as RitualType;
  const copy = RITUAL_COPY[ritualType] ?? RITUAL_COPY.d30_revisit;
  const id = params.id;

  // 진입 시 trigger 표시 (1회)
  useEffect(() => {
    if (!id) return;
    markRevisitTriggered(id).catch((e) =>
      console.warn('[revisit] markRevisitTriggered failed:', e),
    );
  }, [id]);

  const handleComplete = useCallback(async () => {
    if (id) {
      setCompleting(true);
      try {
        await markRevisitCompleted(id);
      } catch (e) {
        console.warn('[revisit] markRevisitCompleted failed:', e);
      } finally {
        setCompleting(false);
      }
    }
    // 사용자가 회상에서 일기로 자연스럽게 이행
    router.replace('/journal');
  }, [id]);

  const handleSkip = useCallback(() => {
    // skip 시에도 markCompleted (다시 묻지 않음). 회상 의식은 *권유*이고 강제 아님.
    if (id) {
      markRevisitCompleted(id).catch(() => {/* 무시 */});
    }
    router.replace('/');
  }, [id]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleSkip();
      return true;
    });
    return () => sub.remove();
  }, [handleSkip]);

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">D+{daysElapsed} · {copy.caption}</Caption>
        <Heading className="mb-6">{copy.heading}</Heading>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Body className="text-gray-100 leading-relaxed">{copy.body}</Body>
        </Card>

        <Card className="mb-6">
          <Caption className="text-gray-400 leading-relaxed">
            정답이 아니야. 네 속도가 맞아.{'\n'}
            지금이 아니어도 괜찮아.
          </Caption>
        </Card>

        {completing && (
          <View className="items-center py-4">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        )}
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label={copy.buttonLabel} onPress={handleComplete} disabled={completing} />
        <PrimaryButton label="다음에 할게" variant="ghost" onPress={handleSkip} />
      </View>
    </ScreenWrapper>
  );
}
