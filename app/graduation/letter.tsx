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
import { useCoolingStore } from '@/store/useCoolingStore';
import { fetchGraduationLetter } from '@/api/ai';

export default function GraduationLetterScreen() {
  const { daysElapsed } = useUserStore();
  const { entries, stats } = useJournalStore();
  const { profile } = useRelationshipStore();
  const { checkinResponses } = useCoolingStore();
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(true);

  const moodAvg = stats?.moodTrend.length
    ? stats.moodTrend.reduce((a, b) => a + b, 0) / stats.moodTrend.length
    : undefined;

  // 유예 체크인에서 감정 점수와 메모 추출
  const checkinMoods = (checkinResponses as Array<Record<string, unknown>>)
    .map((r) => r.mood_score as number)
    .filter(Boolean);
  const checkinNotes = (checkinResponses as Array<Record<string, unknown>>)
    .map((r) => r.note as string)
    .filter(Boolean);

  useEffect(() => {
    fetchGraduationLetter({
      daysElapsed,
      moodAvg,
      reasons: profile.reasons,
      pros: profile.pros,
      cons: profile.cons,
      journalCount: entries.length,
      checkinMoods,
      checkinNotes,
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
        <Caption className="mb-2">졸업 · 2 / 5</Caption>
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
          label="나의 마지막 한 줄 쓰기"
          onPress={() => router.push('/graduation/farewell' as never)}
          disabled={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
