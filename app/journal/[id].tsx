import { Text, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { useJournalStore } from '@/store/useJournalStore';

const DIRECTION_LABEL = { catch: '잡고 싶어', let_go: '보내고 싶어', undecided: '모르겠어' };

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries } = useJournalStore();
  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return (
      <ScreenWrapper>
        <View className="flex-1 items-center justify-center">
          <Caption>일기를 찾을 수 없어.</Caption>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="돌아가기"
          >
            <Text className="text-purple-400 mt-4">돌아가기</Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    );
  }

  const date = new Date(entry.createdAt);

  return (
    <ScreenWrapper>
      <ScrollView className="flex-1 px-6 pt-14" showsVerticalScrollIndicator={false}>
        <BackHeader label="목록" />

        <Caption className="mb-1">
          {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()}
        </Caption>
        <Display className="mb-1">감정 온도 {entry.moodScore}°</Display>
        <Body className="text-purple-400 font-medium mb-6">{DIRECTION_LABEL[entry.direction]}</Body>

        {entry.moodLabel?.length > 0 && (
          <Caption className="mb-6">
            {entry.moodLabel.join('  ·  ')}
          </Caption>
        )}

        {entry.freeText && (
          <View className="mb-6">
            <Caption variant="subtle" className="mb-2">내가 쓴 것</Caption>
            <Body className="text-white">{entry.freeText}</Body>
          </View>
        )}

        {entry.aiResponse && (
          <InsightCard tag="그날의 한마디" body={entry.aiResponse} accent="purple" />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
