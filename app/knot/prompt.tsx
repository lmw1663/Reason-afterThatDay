import { useCallback, useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import { useKnotStore } from '@/store/useKnotStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { resolvePersona } from '@/utils/personaResolver';
import { canEnterKnotTrack, resolveKnotPolicy, type KnotLabel } from '@/utils/knotPolicy';

/**
 * 매듭 짓기 권유 모달 — F-5
 *
 * 트리거 조건(스펙 §4-3 6조건 AND)이 모두 충족됐을 때만 노출. 본 화면은 노출 가정 하에서
 * *어휘 분기*만 책임 — 진입 가드는 F-6 트리거 평가가 보장한다.
 *
 * 분기 라벨(스펙 §3-2):
 *   - 매듭        — P01·P02·P04~P15 등 표준 페르소나
 *   - 마무리      — P16(결혼·이혼)·P17(강제 이별) — 본인 결정이 아닌 수용 어휘
 *   - 단절 30일 달성 — P20(트라우마 본딩) — 신체적 안전을 회복했다는 *성취* 어휘
 *
 * 사용자 응답:
 *   - "응, [라벨]을 지을래"  → recordAccept(cycleIndex) → 매듭 탭 노출 + /knot 진입
 *   - "지금은 아니야"        → recordDecline() → 7일 쿨다운, 모달 닫힘
 *
 * 비단정 / 비낙인 원칙(CLAUDE.md):
 *   - "정답이 아니야" 문구 노출
 *   - "끝내자"·"이제 보내자" 류 단정 어휘 사용 금지
 */

interface PromptCopy {
  title: string;
  body: string;
  acceptLabel: string;
  declineLabel: string;
}

const PROMPT_COPY: Record<KnotLabel, PromptCopy> = {
  매듭: {
    title: '매듭 짓기 시작할까?',
    body:
      '여기까지 와줘서 고마워.\n그동안의 시간을 한 번 정리하는 *매듭*을 지을 수 있어.\n매듭은 끝이 아니야. 너는 언제든 다시 풀어서 다시 시작할 수 있어.',
    acceptLabel: '응, 매듭을 지을래',
    declineLabel: '지금은 아니야',
  },
  마무리: {
    title: '마무리를 시작할까?',
    body:
      '여기까지 와줘서 고마워.\n네가 결정한 게 아닌 일도 *받아들이는 시간*이 필요해.\n마무리는 끝이 아니야. 받아들이는 만큼만 지을 수 있고, 다시 미뤄도 괜찮아.',
    acceptLabel: '응, 마무리를 지을래',
    declineLabel: '지금은 아니야',
  },
  '단절 30일 달성': {
    title: '단절 30일을 지나왔어',
    body:
      '연락하지 않은 30일을 지켜낸 너에게 박수를.\n이 시간을 매듭으로 *기록*해두면, 흔들릴 때 돌아볼 수 있는 자리가 생겨.\n매듭은 끝이 아니야. 사이클의 한 챕터를 닫는 일이야.',
    acceptLabel: '응, 매듭으로 기록할래',
    declineLabel: '아직 기록은 아니야',
  },
};

export default function KnotPromptScreen() {
  const { daysElapsed } = useUserStore();
  const { primary, secondary } = usePersonaStore();
  const { profile } = useRelationshipStore();
  const recordAccept = useKnotStore((s) => s.recordAccept);
  const recordDecline = useKnotStore((s) => s.recordDecline);
  const recordPrompt = useKnotStore((s) => s.recordPrompt);

  // 충돌 해소 후 라벨 결정 — 비허용 페르소나는 F-6에서 차단되어 본 화면 도달 불가
  const resolved = resolvePersona(primary, secondary);
  const policy = resolveKnotPolicy(resolved);
  const copy = PROMPT_COPY[policy.label];

  // 현재 cycle_index — relationship_profile.cycle_count 기준. 미설정 시 1.
  const currentCycleIndex = profile.cycleCount;

  // 임상 안전 가드 — 비허용 페르소나가 딥링크 등으로 우회 진입 시 즉시 차단 (스펙 §10 Q5)
  // 트리거 평가(F-6)가 일차 가드, 본 검사는 *심화 방어선*.
  useEffect(() => {
    if (!canEnterKnotTrack(resolved)) {
      router.replace('/');
      return;
    }
    // 모달 mount 시 1회 발화 기록 → lastTriggerCycle 보존 → 거절 시 같은 cycle 재발화 차단.
    recordPrompt(currentCycleIndex);
    // resolved는 페르소나 store 스냅샷 — store 변경 시 정합성 재검사
  }, [resolved, currentCycleIndex, recordPrompt]);

  const handleAccept = useCallback(() => {
    recordAccept(currentCycleIndex);
    router.replace('/knot');
  }, [recordAccept, currentCycleIndex]);

  const handleDecline = useCallback(() => {
    recordDecline();
    router.back();
  }, [recordDecline]);

  // Android hardware back으로 닫을 때도 *명시적 거절*로 처리 — 7일 쿨다운 일관성
  // (iOS는 fullScreenModal이라 swipe-down 차단됨)
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleDecline();
      return true;
    });
    return () => sub.remove();
  }, [handleDecline]);

  return (
    <ScreenWrapper>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">D+{daysElapsed}</Caption>
        <Heading className="mb-6">{copy.title}</Heading>

        <Card variant="subtle" accent="purple" className="mb-6">
          <Body className="text-gray-100 leading-relaxed">{copy.body}</Body>
        </Card>

        <Card className="mb-6">
          <Caption className="text-gray-400 leading-relaxed">
            정답이 아니야. 네 속도가 맞아.{'\n'}
            지금이 아니어도 괜찮고, 시작했다가 풀어도 괜찮아.
          </Caption>
        </Card>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label={copy.acceptLabel} onPress={handleAccept} />
        <PrimaryButton label={copy.declineLabel} variant="ghost" onPress={handleDecline} />
      </View>
    </ScreenWrapper>
  );
}
