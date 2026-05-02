import { useState } from 'react';
import { View, TextInput, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { Pill } from '@/components/ui/Pill';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Caption, Heading, Body } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
import {
  EMOTION_LABELS,
  PHYSICAL_SIGNALS,
  PHYSICAL_SIGNAL_LABELS,
} from '@/constants/emotionLabels';

export default function JournalMoodScreen() {
  const [score, setScore] = useState(5);
  const [emotionLabels, setEmotionLabels] = useState<string[]>([]);
  const [physicalSignals, setPhysicalSignals] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  function toggleLabel(label: string) {
    setEmotionLabels((prev) =>
      prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label]
    );
  }

  function toggleSignal(signal: string) {
    setPhysicalSignals((prev) =>
      prev.includes(signal) ? prev.filter((x) => x !== signal) : [...prev, signal]
    );
  }

  function handleNext() {
    router.push({
      pathname: '/journal/direction',
      params: {
        score: String(score),
        tags: emotionLabels.join(','),
        physicalSignals: physicalSignals.join(','),
        freeText,
      },
    });
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Caption className="mb-2">이별 일기 · 1 / 4</Caption>
        <Heading className="mb-8">지금 감정 온도가 몇 도야?</Heading>

        <MoodSlider value={score} onChange={setScore} />

        {/* 1.5단계: 감정 라벨 다중 선택 */}
        <View className="mt-10 mb-2">
          <Body className="text-gray-300 mb-1">어떤 감정인지 골라봐</Body>
          <Caption className="text-gray-500 mb-4">여러 개 동시에 느껴도 돼</Caption>
          <View className="flex-row flex-wrap gap-2">
            {EMOTION_LABELS.map((label) => (
              <Pill
                key={label}
                label={label}
                selected={emotionLabels.includes(label)}
                onPress={() => toggleLabel(label)}
              />
            ))}
          </View>
          {emotionLabels.length > 0 && (
            <Caption className="mt-3 text-purple-400">
              지금 그 감정, 정상적인 단계야.
            </Caption>
          )}
        </View>

        {/* 1.6단계: 신체 신호 (선택사항) */}
        <View className="mt-8 mb-2">
          <Body className="text-gray-300 mb-1">몸도 변화가 있었어?</Body>
          <Caption className="text-gray-500 mb-4">선택사항이야, 건너뛰어도 돼</Caption>
          {PHYSICAL_SIGNALS.map((signal) => (
            <Pressable
              key={signal}
              onPress={() => toggleSignal(signal)}
              className="flex-row items-center mb-3"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: physicalSignals.includes(signal) }}
            >
              <View
                className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                  physicalSignals.includes(signal)
                    ? 'bg-purple-500 border-purple-500'
                    : 'border-gray-500'
                }`}
              >
                {physicalSignals.includes(signal) && (
                  <Body className="text-white text-xs leading-none">✓</Body>
                )}
              </View>
              <Body className="text-gray-300">{PHYSICAL_SIGNAL_LABELS[signal]}</Body>
            </Pressable>
          ))}
        </View>

        {/* 1.7단계: 자유 메모 (기존 위치 유지) */}
        <View className="mt-6 mb-4">
          <TextInput
            value={freeText}
            onChangeText={setFreeText}
            placeholder="더 하고 싶은 말이 있으면 써봐 (선택)"
            placeholderTextColor={colors.gray[600]}
            multiline
            accessibilityLabel="감정 자유 메모 (선택)"
            className="text-white text-base leading-relaxed"
            style={{ minHeight: 80 }}
          />
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
