import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import {
  addMemoryLog,
  deleteMemoryLog,
  fetchMemoryLogs,
  type MemoryCategory,
  type MemoryLog,
} from '@/api/memoryLog';
import { formatDateStr } from '@/utils/dateUtils';

interface CategoryMeta {
  key: MemoryCategory;
  icon: IconName;
  label: string;
}

const CATEGORIES: CategoryMeta[] = [
  { key: 'photo',   icon: 'image',          label: '사진' },
  { key: 'message', icon: 'message-circle', label: '메시지' },
  { key: 'place',   icon: 'map-pin',        label: '장소' },
  { key: 'other',   icon: 'archive',        label: '기타' },
];

const CATEGORY_META: Record<MemoryCategory, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.key]: c }),
  {} as Record<MemoryCategory, CategoryMeta>,
);

export default function MemoryLogScreen() {
  const { userId } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<MemoryLog[]>([]);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<MemoryCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<MemoryCategory | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    fetchMemoryLogs(userId)
      .then(setLogs)
      .catch(() => setError('기록을 불러오지 못했어. 잠시 후 다시 시도해봐.'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAdd() {
    const trimmed = content.trim();
    if (!userId || !trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await addMemoryLog(userId, trimmed, category);
      setLogs((prev) => [created, ...prev]);
      setContent('');
      setCategory(null);
    } catch {
      setError('저장이 안 됐어. 다시 시도해볼래?');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id: string) {
    Alert.alert(
      '이 기록 지울까?',
      '한 번 지우면 되돌릴 수 없어.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '지우기',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMemoryLog(id);
              setLogs((prev) => prev.filter((l) => l.id !== id));
            } catch {
              setError('지우기가 안 됐어.');
            }
          },
        },
      ],
    );
  }

  const filteredLogs = useMemo(
    () => (filter === 'all' ? logs : logs.filter((l) => l.category === filter)),
    [logs, filter],
  );

  return (
    <ScreenWrapper keyboardAvoiding>
      <ErrorToast
        visible={!!error}
        message={error ?? ''}
        onHide={() => setError(null)}
      />
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader />

        <Heading className="mb-2">추억 정리</Heading>
        <Body className="text-gray-400 mb-2">
          떠오른 추억을 한 줄씩 기록해두고 모아 봐.
        </Body>
        <Caption className="text-gray-500 mb-6">
          정답은 없어. 너의 속도로 적어두면 돼.
        </Caption>

        {/* 입력 영역 */}
        <Card className="mb-4">
          <Caption className="text-gray-500 mb-2">카테고리 (선택)</Caption>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => {
              const selected = category === cat.key;
              return (
                <Pressable
                  key={cat.key}
                  onPress={() => setCategory(selected ? null : cat.key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? colors.purple[400] : colors.border,
                    backgroundColor: selected ? colors.overlayPurpleSoft : 'transparent',
                  }}
                >
                  <Icon
                    name={cat.icon}
                    size={14}
                    color={selected ? colors.purple[400] : colors.gray[400]}
                  />
                  <Caption
                    style={{
                      color: selected ? colors.purple[400] : colors.gray[400],
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {cat.label}
                  </Caption>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="떠오른 추억을 적어봐..."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={500}
            textAlignVertical="top"
            accessibilityLabel="추억 기록 입력"
            className="text-white text-base px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 80,
            }}
          />
          <View className="flex-row justify-between items-center mt-1 mb-3">
            <Caption className="text-gray-600 text-xs">
              {content.length} / 500
            </Caption>
          </View>

          <PrimaryButton
            label={saving ? '추가 중...' : '추가하기'}
            leftIcon="plus"
            onPress={handleAdd}
            loading={saving}
            disabled={!userId || !content.trim()}
          />
        </Card>

        {/* 필터 */}
        <View className="mt-4 mb-3 flex-row flex-wrap gap-2">
          <FilterChip
            label="전체"
            count={logs.length}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          {CATEGORIES.map((cat) => {
            const count = logs.filter((l) => l.category === cat.key).length;
            if (count === 0) return null;
            return (
              <FilterChip
                key={cat.key}
                icon={cat.icon}
                label={cat.label}
                count={count}
                active={filter === cat.key}
                onPress={() => setFilter(cat.key)}
              />
            );
          })}
        </View>

        {/* 리스트 */}
        {loading ? (
          <View className="py-12 items-center">
            <ActivityIndicator color={colors.purple[400]} />
          </View>
        ) : filteredLogs.length === 0 ? (
          <Card variant="subtle" accent="purple" tone="weak" className="mt-2">
            <Caption className="text-gray-500 text-center">
              {logs.length === 0
                ? '아직 기록이 없어. 첫 추억을 적어볼래?'
                : '이 카테고리엔 아직 기록이 없어.'}
            </Caption>
          </Card>
        ) : (
          <View className="gap-3">
            {filteredLogs.map((log) => {
              const meta = log.category ? CATEGORY_META[log.category] : null;
              return (
                <View
                  key={log.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-2">
                      {meta && (
                        <View className="flex-row items-center gap-1">
                          <Icon name={meta.icon} size={14} color={colors.purple[400]} />
                          <Caption className="text-purple-400 font-medium">
                            {meta.label}
                          </Caption>
                        </View>
                      )}
                      <Caption className="text-gray-600">
                        {formatDateStr(new Date(log.createdAt))}
                      </Caption>
                    </View>
                    <Pressable
                      onPress={() => confirmDelete(log.id)}
                      accessibilityRole="button"
                      accessibilityLabel="기록 지우기"
                      hitSlop={8}
                      className="active:opacity-60"
                    >
                      <Icon name="trash" size={16} color={colors.gray[600]} />
                    </Pressable>
                  </View>
                  <Body className="text-gray-200 leading-relaxed">{log.content}</Body>
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

function FilterChip({
  label,
  count,
  active,
  onPress,
  icon,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
      style={{
        borderWidth: 1,
        borderColor: active ? colors.purple[400] : colors.border,
        backgroundColor: active ? colors.overlayPurpleSoft : 'transparent',
      }}
    >
      {icon && (
        <Icon name={icon} size={12} color={active ? colors.purple[400] : colors.gray[400]} />
      )}
      <Caption
        style={{
          color: active ? colors.purple[400] : colors.gray[400],
          fontWeight: active ? '600' : '400',
        }}
      >
        {label} {count}
      </Caption>
    </Pressable>
  );
}
