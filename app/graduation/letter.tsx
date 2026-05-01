import { useEffect, useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Caption, Heading } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { fetchGraduationLetter } from '@/api/ai';

export default function GraduationLetterScreen() {
  const { daysElapsed } = useUserStore();
  const { entries, stats } = useJournalStore();
  const { profile } = useRelationshipStore();
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(true);

  const moodAvg = stats?.moodTrend.length
    ? stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length
    : undefined;

  useEffect(() => {
    fetchGraduationLetter({
      daysElapsed,
      moodAvg,
      reasons: profile.reasons,
      pros: profile.pros,
      cons: profile.cons,
      journalCount: entries.length,
    })
      .then(setLetter)
      .finally(() => setLoading(false));
  }, []);

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Caption className="mb-2">졸업 · 2 / 4</Caption>
        <Heading className="mb-8">나에게 쓰는 편지</Heading>

        {loading ? (
          <View className="items-center py-12">
            <ActivityIndicator color={colors.purple[400]} size="large" />
            <Caption className="mt-4">편지를 쓰고 있어 …</Caption>
          </View>
        ) : (
          <View
            className="bg-surface rounded-2xl p-6"
            style={{ borderLeftWidth: 3, borderLeftColor: colors.purple[400] }}
            accessibilityRole="text"
            accessibilityLabel="졸업 편지"
          >
            <Text className="text-white text-base leading-loose">{letter}</Text>
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="다음 — 마지막 확인"
          onPress={() => router.push('/graduation/confirm')}
          disabled={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
