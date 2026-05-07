import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useUserStore } from '@/store/useUserStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useKnotStore } from '@/store/useKnotStore';
import { confirmGraduation, resetCooling } from '@/api/graduation';
import { useKnotPolicy } from '@/hooks/useKnotPolicy';

/**
 * 쿨링 final — F-8
 *
 * Day N(페르소나별) 최종 확인 화면. 매듭 확정 시:
 *   1. graduation_cooling.status = 'confirmed' (DB) + users.graduation_confirmed_at
 *   2. useRelationshipStore.lastKnotAt 기록 (store만 — DB 동기화는 cycle-prompt가 책임)
 *   3. useKnotStore.hideKnotTab() — 하단 매듭 탭 사라짐
 *   4. /(tabs)로 복귀
 *
 * **cycleCount++·archive 보존은 본 화면에서 하지 않는다**. 사용자가 *다음 홈에서*
 * cycle-prompt(이어쓰기 vs 새 사이클)를 보고 *새 사이클 선택* 시점에 archive INSERT +
 * cycleCount++가 일어남. 이중 증가 방지·사용자 의도 존중(스펙 §4-2 가역성 진입점).
 *
 * "건너뛰기"는 페르소나별 N일만큼 연장 (resetCooling).
 */
export default function CoolingFinalScreen() {
  const [loading, setLoading] = useState(false);
  const { id, updateStatus } = useCoolingStore();
  const { userId } = useUserStore();
  const updateField = useRelationshipStore((s) => s.updateField);
  const hideKnotTab = useKnotStore((s) => s.hideKnotTab);
  const { label, coolingDays } = useKnotPolicy();

  async function handleConfirm() {
    if (!id || !userId) return;
    setLoading(true);
    try {
      await confirmGraduation(userId, id); // archive·cycleCount++는 cycle-prompt 책임
      updateStatus('confirmed');
      // store에만 lastKnotAt 기록 → cyclePromptTrigger가 다음 홈에서 prompt 노출 판정
      updateField('lastKnotAt', new Date().toISOString());
      hideKnotTab();
      router.replace('/(tabs)');
    } catch (e) {
      console.warn('[knot-final] confirmGraduation failed:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleExtend() {
    if (!id) return;
    setLoading(true);
    try {
      // 페르소나별 N일 연장
      await resetCooling(id, coolingDays);
      router.replace('/cooling');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">Day {coolingDays}</Caption>
        <Heading className="mb-2">최종 확인</Heading>
        <Body className="text-gray-400 mb-10">
          {coolingDays}일이 지났어. 지금 어떤 마음이야?
        </Body>

        <Card className="p-6 mb-6">
          <Text className="text-white text-base leading-loose text-center">
            정답이 아니야.{'\n'}
            지금의 너에게 맞는 결정을 해도 괜찮아.
          </Text>
        </Card>

        <Card variant="subtle" accent="purple" tone="weak" className="mb-4">
          <Caption className="text-purple-400 text-center leading-relaxed">
            {label} 후에도 언제든 다시 풀 수 있어.{'\n'}
            이건 끝이 아니라 사이클의 한 챕터를 닫는 일이야.
          </Caption>
        </Card>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          leftIcon="link"
          label={`${label} 짓기`}
          onPress={handleConfirm}
          loading={loading}
        />
        <PrimaryButton
          label={`아직 아니야, ${coolingDays}일 더 생각해볼게`}
          variant="ghost"
          onPress={handleExtend}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
