import { Text, View, ScrollView, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { InsightCard } from '@/components/ui/InsightCard';
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
          <Text className="text-gray-400">일기를 찾을 수 없어.</Text>
          <Pressable onPress={() => router.back()}>
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
        <Pressable onPress={() => router.back()}>
          <Text className="text-purple-400 mb-4">← 목록으로</Text>
        </Pressable>

        <Text className="text-gray-400 text-sm mb-1">
          {date.getFullYear()}.{date.getMonth() + 1}.{date.getDate()}
        </Text>
        <Text className="text-white text-3xl font-bold mb-1">감정 온도 {entry.moodScore}°</Text>
        <Text className="text-purple-400 font-medium mb-6">{DIRECTION_LABEL[entry.direction]}</Text>

        {entry.moodLabel?.length > 0 && (
          <Text className="text-gray-400 text-sm mb-6">
            {entry.moodLabel.join('  ·  ')}
          </Text>
        )}

        {entry.freeText && (
          <View className="mb-6">
            <Text className="text-gray-600 text-xs mb-2">내가 쓴 것</Text>
            <Text className="text-white text-base leading-relaxed">{entry.freeText}</Text>
          </View>
        )}

        {entry.aiResponse && (
          <InsightCard tag="그날의 한마디" body={entry.aiResponse} accent="purple" />
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
