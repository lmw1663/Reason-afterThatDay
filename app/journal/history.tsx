import { useEffect } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Caption, Heading } from '@/components/ui/Typography';
import { useJournalStore, type JournalEntry } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { fetchRecentEntries } from '@/api/journal';

const DIRECTION_LABEL = { catch: '잡고 싶어', let_go: '보내고 싶어', undecided: '모르겠어' };
const DIRECTION_COLOR = { catch: colors.purple[400], let_go: colors.teal[400], undecided: colors.gray[400] };

export default function JournalHistoryScreen() {
  const { userId } = useUserStore();
  const { entries, setEntries } = useJournalStore();

  useEffect(() => {
    if (!userId) return;
    fetchRecentEntries(userId, 30)
      .then(setEntries)
      .catch((e) => console.warn('[journal] fetchRecentEntries failed:', e));
  }, [userId]);

  function renderItem({ item }: { item: JournalEntry }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const directionLabel = DIRECTION_LABEL[item.direction];
    return (
      <Pressable
        onPress={() => router.push(`/journal/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`${dateStr} 일기, 감정 온도 ${item.moodScore}도, ${directionLabel}`}
        className="flex-row items-center p-4 rounded-2xl mb-3 bg-surface active:opacity-70"
      >
        <View className="mr-4">
          <Caption className="text-center">{dateStr}</Caption>
          <Text className="text-white text-2xl font-bold text-center">{item.moodScore}°</Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-sm font-medium mb-1"
            style={{ color: DIRECTION_COLOR[item.direction] }}
          >
            {directionLabel}
          </Text>
          {item.freeText ? (
            <Caption numberOfLines={2}>{item.freeText}</Caption>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">이별 일기</Caption>
        <Heading className="mb-6">지나온 기록들</Heading>

        {entries.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Caption variant="subtle" className="text-base">
              아직 일기가 없어. 오늘 첫 기록을 남겨봐.
            </Caption>
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}
