import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useJournalStore } from '@/store/useJournalStore';

const CATEGORY_OPTIONS = [
  { id: 'happy',   label: '행복했던 순간',  color: colors.teal[400]   },
  { id: 'miss',    label: '지금도 그리운 것', color: colors.purple[400] },
  { id: 'painful', label: '아팠던 순간',    color: colors.coral[400]  },
  { id: 'growth',  label: '성장한 부분',    color: colors.amber[400]  },
];

export default function MemoryIndexScreen() {
  const { entries } = useJournalStore();
  const [selected, setSelected] = useState<string | null>(null);

  const moodScores = entries.slice(0, 7).map((e) => e.moodScore);
  const avg = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : null;

  function handleStart() {
    if (!selected) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/memory/write' as any, params: { category: selected } });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Icon name="chevron-left" size={20} color={colors.gray[400]} />
        </Pressable>

        <Heading className="mb-2">추억 돌아보기</Heading>
        <Body className="text-gray-400 mb-8">
          그 관계의 어떤 부분을 돌아보고 싶어?{'\n'}
          기억은 사라지지 않아. 다만 다르게 느껴질 뿐이야.
        </Body>

        {avg && (
          <Card variant="subtle" accent="purple" className="mb-8">
            <Caption className="text-purple-400">
              최근 감정 온도 평균 {avg}° — 이 기억들이 그 온도를 만들었을 거야.
            </Caption>
          </Card>
        )}

        <View className="gap-3 mb-8">
          {CATEGORY_OPTIONS.map((opt) => (
            <Pressable
              key={opt.id}
              onPress={() => setSelected(opt.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selected === opt.id }}
            >
              <Card
                variant={selected === opt.id ? 'accent' : 'default'}
                className="flex-row items-center justify-between"
              >
                <Body
                  className="font-medium"
                  style={{ color: selected === opt.id ? opt.color : colors.gray[400] }}
                >
                  {opt.label}
                </Body>
                {selected === opt.id && (
                  <Icon name="check" size={18} color={opt.color} />
                )}
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="기억 꺼내보기"
          onPress={handleStart}
          disabled={!selected}
        />
        <PrimaryButton
          label="홈으로"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}
