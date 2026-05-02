import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import {
  fetchMemoryOrg,
  upsertMemoryOrg,
  type MemoryCategory,
  type MemoryOrgEntry,
} from '@/api/memoryOrganization';
import { formatDateStr } from '@/utils/dateUtils';

interface CategoryMeta {
  key: MemoryCategory;
  emoji: string;
  title: string;
  guide: string;
  hint: string;
  hasNotes?: boolean;
  notesPlaceholder?: string;
}

const CATEGORIES: CategoryMeta[] = [
  {
    key: 'photos',
    emoji: '📷',
    title: '사진 정리',
    guide: '추억 폴더로 옮기거나 백업해둬봐.',
    hint: '앱은 사진에 접근 안 해. 너만의 속도로 진행해.',
  },
  {
    key: 'messages',
    emoji: '💬',
    title: '메시지 정리',
    guide: '카톡/문자를 백업하거나 차단을 고려해봐.',
    hint: '너의 선택이야, 강요 아니야.',
  },
  {
    key: 'places',
    emoji: '📍',
    title: '장소 리스트',
    guide: '당분간 피하고 싶은 장소를 적어봐. (선택사항)',
    hint: '꺼내놓는 것만으로도 정리가 시작돼.',
    hasNotes: true,
    notesPlaceholder: '예: 자주 같이 갔던 카페, 산책로...',
  },
];

export default function MemoryOrganizationScreen() {
  const { userId } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<Partial<Record<MemoryCategory, MemoryOrgEntry>>>({});
  const [savingKey, setSavingKey] = useState<MemoryCategory | null>(null);
  const [placesNote, setPlacesNote] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchMemoryOrg(userId)
      .then((data) => {
        setEntries(data);
        if (data.places?.notes) setPlacesNote(data.places.notes);
      })
      .catch((e) => console.warn('[memories] fetchMemoryOrg failed:', e))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleComplete(category: MemoryCategory) {
    if (!userId || savingKey) return;
    setSavingKey(category);
    try {
      const notes =
        category === 'places'
          ? placesNote.trim() || null
          : entries[category]?.notes ?? null;
      const updated = await upsertMemoryOrg(userId, category, {
        isCompleted: true,
        notes,
      });
      setEntries((prev) => ({ ...prev, [category]: updated }));
    } catch (e) {
      console.warn('[memories] upsert failed:', e);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleSavePlacesNote() {
    if (!userId || savingKey) return;
    setSavingKey('places');
    try {
      const existing = entries.places;
      const updated = await upsertMemoryOrg(userId, 'places', {
        isCompleted: existing?.isCompleted ?? false,
        notes: placesNote.trim() || null,
      });
      setEntries((prev) => ({ ...prev, places: updated }));
    } catch (e) {
      console.warn('[memories] save places note failed:', e);
    } finally {
      setSavingKey(null);
    }
  }

  const totalCompleted = useMemo(
    () => CATEGORIES.filter((c) => entries[c.key]?.isCompleted).length,
    [entries],
  );

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />

        <Heading className="mb-2">추억 정리하기</Heading>
        <Body className="text-gray-400 mb-2">
          기억할 가치는 보존하고, 나머지는 정리해볼까?
        </Body>
        <Caption className="text-gray-500 mb-6">
          앱은 너의 사진·메시지에 접근하지 않아. 가이드만 줄게.
        </Caption>

        <Card variant="subtle" accent="purple" tone="weak" className="mb-6">
          <Caption className="text-purple-400">
            지금 {totalCompleted} / {CATEGORIES.length} 정리했어 — 정답이 아니야, 너의 속도로 가면 돼.
          </Caption>
        </Card>

        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : (
          <View className="gap-4">
            {CATEGORIES.map((cat) => {
              const entry = entries[cat.key];
              const isCompleted = !!entry?.isCompleted;
              const isSaving = savingKey === cat.key;

              return (
                <View
                  key={cat.key}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: isCompleted ? colors.purple[600] : colors.border,
                  }}
                >
                  <View className="flex-row items-center mb-2">
                    <Body className="text-2xl mr-2">{cat.emoji}</Body>
                    <Body className="text-white font-semibold flex-1">{cat.title}</Body>
                    {isCompleted && (
                      <View className="flex-row items-center gap-1">
                        <Icon name="check" size={16} color={colors.purple[400]} />
                        <Caption className="text-purple-400">완료</Caption>
                      </View>
                    )}
                  </View>

                  <Body className="text-gray-300 mb-1">{cat.guide}</Body>
                  <Caption className="text-gray-500 mb-3">{cat.hint}</Caption>

                  {cat.hasNotes && (
                    <View className="mb-3">
                      <TextInput
                        value={placesNote}
                        onChangeText={setPlacesNote}
                        placeholder={cat.notesPlaceholder}
                        placeholderTextColor={colors.gray[600]}
                        multiline
                        textAlignVertical="top"
                        accessibilityLabel="피하고 싶은 장소 메모"
                        className="text-white text-base px-4 py-3 rounded-xl"
                        style={{
                          backgroundColor: colors.bg,
                          borderWidth: 1,
                          borderColor: colors.border,
                          minHeight: 80,
                        }}
                      />
                    </View>
                  )}

                  {isCompleted && entry?.completedAt ? (
                    <Caption className="text-gray-500 mb-2">
                      정리한 날: {formatDateStr(new Date(entry.completedAt))}
                    </Caption>
                  ) : null}

                  <View className="gap-2">
                    {cat.hasNotes && (
                      <PrimaryButton
                        label={isSaving ? '저장 중...' : '메모 저장'}
                        variant="ghost"
                        onPress={handleSavePlacesNote}
                        loading={isSaving && !isCompleted}
                        disabled={!userId}
                      />
                    )}
                    {isCompleted ? (
                      <PrimaryButton
                        label="다시 미완료로"
                        variant="ghost"
                        onPress={async () => {
                          if (!userId || savingKey) return;
                          setSavingKey(cat.key);
                          try {
                            const updated = await upsertMemoryOrg(userId, cat.key, {
                              isCompleted: false,
                              notes:
                                cat.key === 'places'
                                  ? placesNote.trim() || null
                                  : entries[cat.key]?.notes ?? null,
                            });
                            setEntries((prev) => ({ ...prev, [cat.key]: updated }));
                          } catch (e) {
                            console.warn('[memories] revert failed:', e);
                          } finally {
                            setSavingKey(null);
                          }
                        }}
                        loading={isSaving}
                        disabled={!userId}
                      />
                    ) : (
                      <PrimaryButton
                        label={isSaving ? '저장 중...' : '정리했어'}
                        leftIcon="check"
                        onPress={() => handleComplete(cat.key)}
                        loading={isSaving}
                        disabled={!userId}
                      />
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="홈으로"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}
