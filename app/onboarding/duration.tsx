import { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { DURATION_OPTIONS, type DurationRange } from '@/constants/duration';
import { colors } from '@/constants/colors';

export default function OnboardingDurationScreen() {
  const [selected, setSelected] = useState<DurationRange | null>(null);
  const [loading, setLoading] = useState(false);
  const { setRelationshipDuration } = useUserStore();

  async function handleNext() {
    setLoading(true);
    try {
      const choice = selected ?? 'skip';
      await setRelationshipDuration(choice);
      router.push('/onboarding/mood');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-16">
        <Caption className="mb-2">reason · 2 / 3</Caption>
        <Display className="mb-2">그 사람이랑{'\n'}얼마나 만났어?</Display>
        <Body className="text-gray-400 mb-8">
          대략적으로 괜찮아.
        </Body>

        <View className="gap-3">
          {DURATION_OPTIONS.map(({ value, label }) => {
            const isSelected = selected === value;
            return (
              <Pressable
                key={value}
                onPress={() => setSelected(value as DurationRange)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                className={`rounded-2xl px-5 py-4 active:opacity-70 ${
                  isSelected ? 'bg-purple-600' : 'bg-surface'
                }`}
              >
                <Body
                  className={isSelected ? 'text-white font-semibold' : 'text-gray-300'}
                >
                  {label}
                </Body>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={3} current={1} />
        <PrimaryButton
          label={selected ? '다음' : '건너뛸게'}
          onPress={handleNext}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
