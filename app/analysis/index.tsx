import { useState } from 'react';
import { Text, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useRelationshipStore } from '@/store/useRelationshipStore';

const REASON_CATEGORIES = [
  { label: '성격 차이', color: 'purple' as const },
  { label: '소통 문제',  color: 'coral'  as const },
  { label: '가치관 차이', color: 'amber'  as const },
  { label: '거리/환경',  color: 'teal'   as const },
  { label: '신뢰 문제',  color: 'pink'   as const },
  { label: '감정 온도차', color: 'purple' as const },
  { label: '미래 방향',  color: 'teal'   as const },
  { label: '외부 압박',  color: 'amber'  as const },
  { label: '자존감 문제', color: 'coral'  as const },
  { label: '잦은 다툼',  color: 'pink'   as const },
  { label: '권태',      color: 'purple' as const },
  { label: '그냥 시간',  color: 'teal'   as const },
];

export default function AnalysisReasonScreen() {
  const { profile, updateField } = useRelationshipStore();
  const [selected, setSelected] = useState<string[]>(profile.reasons);

  function toggle(label: string) {
    setSelected((prev) =>
      prev.includes(label) ? prev.filter((r) => r !== label) : [...prev, label],
    );
  }

  function handleNext() {
    updateField('reasons', selected);
    router.push('/analysis/pros-cons');
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-gray-400 text-sm mb-2">관계 분석 · 1 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">왜 헤어졌어?</Text>
        <Text className="text-gray-400 text-sm mb-8">
          여러 개 골라도 돼. 복잡한 이유가 있어도 괜찮아.
        </Text>

        <View className="flex-row flex-wrap">
          {REASON_CATEGORIES.map(({ label, color }) => (
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
          <ProgressDots total={4} current={0} />
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="다음"
          onPress={handleNext}
          disabled={selected.length === 0}
        />
      </View>
    </ScreenWrapper>
  );
}
