import { useState } from 'react';
import { ScrollView, View, Pressable, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { DirectionPicker } from '@/components/ui/DirectionPicker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useJournalStore, type Direction } from '@/store/useJournalStore';
import { colors } from '@/constants/colors';

const AFFECTION_STEPS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function JournalDirectionScreen() {
  const params = useLocalSearchParams<{
    score: string;
    tags: string;
    physicalSignals: string;
    freeText: string;
  }>();
  const { entries } = useJournalStore();
  const lastDirection = entries[0]?.direction ?? null;

  const [direction, setDirection] = useState<Direction | null>(null);
  const [affectionLevel, setAffectionLevel] = useState(5);

  function handleNext() {
    if (!direction) return;
    router.push({
      pathname: '/journal/question',
      params: { ...params, direction, affectionLevel: String(affectionLevel) },
    });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <BackHeader />
        <Caption className="mb-2">이별 일기 · 2 / 4</Caption>
        <Heading className="mb-2">지금 마음은 어느 쪽이야?</Heading>
        <Body className="text-gray-400 mb-6">
          지금 이 순간의 느낌 그대로 선택해봐.
        </Body>

        <DirectionPicker
          value={direction}
          onChange={setDirection}
          prevDirection={lastDirection}
        />

        {/* 애정↔원망 수평축 슬라이더 */}
        <View className="mt-10">
          <Body className="text-gray-300 mb-1">지금 상대를 어떻게 느껴?</Body>
          <Caption className="text-gray-500 mb-4">선택사항이야</Caption>

          <View className="flex-row justify-between mb-2">
            <Caption className="text-coral-400">완전히 미워</Caption>
            <Caption className="text-purple-400">여전히 좋아</Caption>
          </View>

          <View className="flex-row justify-between items-end">
            {AFFECTION_STEPS.map((step) => (
              <Pressable
                key={step}
                onPress={() => setAffectionLevel(step)}
                accessibilityRole="adjustable"
                accessibilityLabel={`애정 수준 ${step}점`}
                accessibilityState={{ selected: step === affectionLevel }}
                style={{ alignItems: 'center' }}
              >
                <View
                  style={{
                    width: 20,
                    height: step === affectionLevel ? 48 : 28,
                    borderRadius: 4,
                    backgroundColor:
                      step <= affectionLevel
                        ? step <= 3
                          ? colors.coral[400]
                          : step >= 7
                          ? colors.purple[400]
                          : colors.gray[600]
                        : colors.border,
                  }}
                />
                <Text className="text-gray-600 text-xs mt-1">{step}</Text>
              </Pressable>
            ))}
          </View>

          {direction && (
            <Caption className="mt-3 text-gray-400 text-center">
              {affectionLevel <= 3 && direction === 'catch'
                ? '잡고 싶은 마음과 미운 마음이 동시에 있는 거 같아. 그럴 수 있어.'
                : '지금 이 마음도 자연스러운 거야.'}
            </Caption>
          )}
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} disabled={!direction} />
      </View>
    </ScreenWrapper>
  );
}
