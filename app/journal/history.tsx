import { useEffect } from 'react';
import { Text, View, FlatList, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { useJournalStore, type JournalEntry } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { fetchRecentEntries } from '@/api/journal';

const DIRECTION_LABEL = { catch: '잡고 싶어', let_go: '보내고 싶어', undecided: '모르겠어' };
const DIRECTION_COLOR = { catch: '#7F77DD', let_go: '#1D9E75', undecided: '#888780' };

export default function JournalHistoryScreen() {
  const { userId } = useUserStore();
  const { entries, setEntries } = useJournalStore();

  useEffect(() => {
    if (userId) {
      fetchRecentEntries(userId, 30).then(setEntries).catch(() => {});
    }
  }, [userId]);

  function renderItem({ item }: { item: JournalEntry }) {
    const date = new Date(item.createdAt);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    return (
      <Pressable
        onPress={() => router.push(`/journal/${item.id}`)}
        className="flex-row items-center p-4 rounded-2xl mb-3 active:opacity-70"
        style={{ backgroundColor: '#1A1A22' }}
      >
        <View className="mr-4">
          <Text className="text-gray-400 text-xs text-center">{dateStr}</Text>
          <Text className="text-white text-2xl font-bold text-center">{item.moodScore}°</Text>
        </View>
        <View className="flex-1">
          <Text
            className="text-sm font-medium mb-1"
            style={{ color: DIRECTION_COLOR[item.direction] }}
          >
            {DIRECTION_LABEL[item.direction]}
          </Text>
          {item.freeText ? (
            <Text className="text-gray-400 text-sm" numberOfLines={2}>{item.freeText}</Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">이별 일기</Text>
        <Text className="text-white text-2xl font-bold mb-6">지나온 기록들</Text>

        {entries.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-gray-600 text-base">아직 일기가 없어. 오늘 첫 기록을 남겨봐.</Text>
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
