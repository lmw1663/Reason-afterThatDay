import { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/api/supabase';

const MOODS = [
  { label: '슬퍼', color: 'purple' as const },
  { label: '화나', color: 'coral' as const },
  { label: '허전해', color: 'teal' as const },
  { label: '후련해', color: 'teal' as const },
  { label: '미련 있어', color: 'pink' as const },
  { label: '그리워', color: 'purple' as const },
  { label: '혼란스러워', color: 'amber' as const },
  { label: '무감각해', color: 'purple' as const },
  { label: '괜찮아', color: 'teal' as const },
  { label: '지쳐', color: 'coral' as const },
  { label: '외로워', color: 'purple' as const },
  { label: '후회돼', color: 'pink' as const },
];

export default function OnboardingMoodScreen() {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { userId, setOnboardingCompleted } = useUserStore();

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  }

  async function handleDone() {
    setLoading(true);
    try {
      if (userId) {
        await supabase.from('users').update({ onboarding_completed: true }).eq('id', userId);
      }
      setOnboardingCompleted(true);
      router.replace('/(tabs)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-16"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">reason · 3 / 3</Caption>
        <Display className="mb-2">지금 기분이 어때?</Display>
        <Body className="text-gray-400 mb-8">
          여러 개 골라도 괜찮아. 복잡한 게 당연해.
        </Body>

        <View className="flex-row flex-wrap">
          {MOODS.map(({ label, color }) => (
            <Pill
              key={label}
              label={label}
              color={color}
              selected={selected.includes(label)}
              onPress={() => toggle(label)}
            />
          ))}
        </View>

        <View className="mt-10 mb-4">
          <ProgressDots total={3} current={2} />
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label={selected.length === 0 ? '건너뛸게' : '시작할게'}
          onPress={handleDone}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
