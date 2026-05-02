import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { CoolingOffWarningModal } from '@/components/CoolingOffWarningModal';
import { useDecisionStore } from '@/store/useDecisionStore';
import { useUserStore } from '@/store/useUserStore';
import { VERDICT_LABEL, VERDICT_COLOR } from '@/utils/diagnosis';

export default function CompassTabScreen() {
  const { history, latestVerdict } = useDecisionStore();
  const { daysElapsed } = useUserStore();
  const [showCoolingoffWarning, setShowCoolingoffWarning] = useState(false);

  useEffect(() => {
    if (daysElapsed < 8) setShowCoolingoffWarning(true);
  }, []);

  return (
    <ScreenWrapper>
      <CoolingOffWarningModal
        visible={showCoolingoffWarning}
        day={daysElapsed}
        context="analysis"
        onProceed={() => setShowCoolingoffWarning(false)}
        onCancel={() => router.back()}
      />
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">결정 나침반</Caption>
        <Heading className="mb-6">마음의 방향을 탐색해봐</Heading>

        {latestVerdict && (
          <View
            className="bg-surface rounded-2xl p-4 mb-6"
            style={{ borderLeftWidth: 4, borderLeftColor: VERDICT_COLOR[latestVerdict] }}
            accessibilityRole="text"
            accessibilityLabel={`마지막 결과: ${VERDICT_LABEL[latestVerdict]}`}
          >
            <Caption variant="subtle" className="mb-1">마지막 결과</Caption>
            <Text className="font-semibold text-base" style={{ color: VERDICT_COLOR[latestVerdict] }}>
              {VERDICT_LABEL[latestVerdict]}
            </Text>
          </View>
        )}

        <Body className="text-gray-400 mb-6">
          나침반은 단순히 "잡아" 또는 "놔"를 알려주는 게 아니야.{'\n'}
          지금 네 마음이 어디를 향하는지 함께 들여다보는 거야.
        </Body>

        {history.length > 0 && (
          <View className="mb-6">
            <Caption variant="subtle" className="mb-3">이전 기록</Caption>
            {history.slice(0, 3).map((h) => (
              <View
                key={h.id}
                className="flex-row items-center py-3 border-b"
                style={{ borderBottomColor: colors.border }}
              >
                <View className="flex-1">
                  <Text className="text-white text-sm">{VERDICT_LABEL[h.verdict]}</Text>
                  <Caption variant="subtle" className="mt-0.5">
                    {new Date(h.createdAt).toLocaleDateString('ko-KR')}
                  </Caption>
                </View>
                <View
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: VERDICT_COLOR[h.verdict] }}
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                />
              </View>
            ))}
          </View>
        )}
      </View>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="나침반 탐색하기"
          onPress={() => router.push('/compass')}
        />
      </View>
    </ScreenWrapper>
  );
}
