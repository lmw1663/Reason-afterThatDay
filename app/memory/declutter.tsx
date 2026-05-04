import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { formatDateStr } from '@/utils/dateUtils';
import { useScreenView } from '@/hooks/useScreenView';

// G-7c-3: P15 동거 정리 사용자를 위한 *짐 정리 워크시트* (매트릭스 §2 C7 line 268).
// 사진·물건 분류로 *행정·감정 분리* 트랙. 정리 작업과 마음 정리를 한 화면에서 섞지 않음.
// 화면 텍스트엔 페르소나 코드/명칭 노출 금지.

const STORAGE_KEY = 'memory_declutter_v1';

type DeclutterAction = 'keep' | 'discard' | 'share';

interface DeclutterEntry {
  id: string;
  item: string;
  action: DeclutterAction;
  note: string;
  createdAt: number;
}

interface ActionMeta {
  id: DeclutterAction;
  label: string;
  short: string;
  icon: IconName;
  color: string;
}

const ACTION_META: Record<DeclutterAction, ActionMeta> = {
  keep:    { id: 'keep',    label: '내가 가져갈 것',  short: '보관', icon: 'archive',  color: colors.purple[400] },
  discard: { id: 'discard', label: '버리거나 정리할 것', short: '정리', icon: 'trash',    color: colors.coral[400] },
  share:   { id: 'share',   label: '상대에게 돌려줄 것', short: '돌려줌', icon: 'heart-handshake',  color: colors.teal[400] },
};

const ACTION_ORDER: DeclutterAction[] = ['keep', 'discard', 'share'];

export default function MemoryDeclutterScreen() {
  const [entries, setEntries] = useState<DeclutterEntry[]>([]);
  const [item, setItem] = useState('');
  const [action, setAction] = useState<DeclutterAction>('keep');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<DeclutterAction | 'all'>('all');
  const toast = useRef(new Animated.Value(0)).current;

  useScreenView('memory_declutter');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as DeclutterEntry[];
        setEntries(parsed.sort((a, b) => b.createdAt - a.createdAt));
      } catch {
        // 손상된 데이터는 무시
      }
    });
  }, []);

  async function handleAdd() {
    const trimmed = item.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const entry: DeclutterEntry = {
      id: `dc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      item: trimmed,
      action,
      note: note.trim(),
      createdAt: Date.now(),
    };
    const next = [entry, ...entries];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
      setItem('');
      setNote('');
      Animated.sequence([
        Animated.timing(toast, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(toast, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } catch {
      // 저장 실패는 fail open
    } finally {
      setSaving(false);
    }
  }

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.action === filter);
  const counts: Record<DeclutterAction, number> = {
    keep: entries.filter((e) => e.action === 'keep').length,
    discard: entries.filter((e) => e.action === 'discard').length,
    share: entries.filter((e) => e.action === 'share').length,
  };

  return (
    <ScreenWrapper keyboardAvoiding>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader />

        <Heading className="mb-2">물건 정리 워크시트</Heading>
        <Body className="text-gray-400 mb-3">
          정리 작업과 마음 정리는 다른 거야.
        </Body>
        <Caption className="text-gray-500 mb-6 leading-5">
          한 항목씩 어떻게 할지 분류해두자.{'\n'}
          이 기기에 보관돼 — 너 혼자 보는 메모야.
        </Caption>

        <Card className="mb-4">
          <Caption className="text-gray-500 mb-3">새 항목</Caption>
          <TextInput
            value={item}
            onChangeText={setItem}
            placeholder="예: 함께 찍은 사진들 / 빌려준 책 / 공동 계좌 정리..."
            placeholderTextColor={colors.gray[600]}
            maxLength={120}
            accessibilityLabel="정리할 항목"
            className="text-white text-base px-4 py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <Caption className="text-gray-500 mb-2">어떻게 할 거야?</Caption>
          <View className="gap-2 mb-3">
            {ACTION_ORDER.map((a) => {
              const meta = ACTION_META[a];
              const selected = action === a;
              return (
                <Pressable
                  key={a}
                  onPress={() => setAction(a)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-70"
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? meta.color : colors.border,
                    backgroundColor: selected ? colors.overlayPurpleSoft : 'transparent',
                  }}
                >
                  <Icon name={meta.icon} size={16} color={selected ? meta.color : colors.gray[400]} />
                  <Body
                    style={{
                      color: selected ? meta.color : colors.gray[400],
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {meta.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="메모 (선택) — 마감일·장소·기분..."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={200}
            textAlignVertical="top"
            accessibilityLabel="메모"
            className="text-white text-sm px-4 py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 60,
            }}
          />

          <PrimaryButton
            label={saving ? '추가 중...' : '워크시트에 추가'}
            leftIcon="plus"
            onPress={handleAdd}
            loading={saving}
            disabled={!item.trim()}
          />
        </Card>

        {entries.length > 0 && (
          <View className="mt-2 mb-3 flex-row flex-wrap gap-2">
            <FilterChip
              label={`전체 ${entries.length}`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {ACTION_ORDER.map((a) => {
              if (counts[a] === 0) return null;
              const meta = ACTION_META[a];
              return (
                <FilterChip
                  key={a}
                  label={`${meta.short} ${counts[a]}`}
                  icon={meta.icon}
                  color={meta.color}
                  active={filter === a}
                  onPress={() => setFilter(a)}
                />
              );
            })}
          </View>
        )}

        {filtered.length === 0 ? (
          <Card variant="subtle" accent="purple" tone="weak" className="mt-2">
            <Caption className="text-gray-500 text-center">
              {entries.length === 0
                ? '아직 항목이 없어. 첫 한 가지부터 적어볼래?'
                : '이 분류엔 아직 항목이 없어.'}
            </Caption>
          </Card>
        ) : (
          <View className="gap-3">
            {filtered.map((e) => {
              const meta = ACTION_META[e.action];
              return (
                <View
                  key={e.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      <Icon name={meta.icon} size={14} color={meta.color} />
                      <Caption style={{ color: meta.color, fontWeight: '600' }}>
                        {meta.short}
                      </Caption>
                    </View>
                    <Caption className="text-gray-600">
                      {formatDateStr(new Date(e.createdAt))}
                    </Caption>
                  </View>
                  <Body className="text-gray-200 leading-relaxed">{e.item}</Body>
                  {e.note ? (
                    <Caption className="text-gray-500 mt-2 leading-5">{e.note}</Caption>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 32,
          opacity: toast,
          transform: [
            { translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        <Card variant="accent" className="flex-row items-center gap-2 justify-center">
          <Icon name="check" size={16} color={colors.purple[400]} />
          <Body className="text-purple-400">분류해뒀어</Body>
        </Card>
      </Animated.View>
    </ScreenWrapper>
  );
}

function FilterChip({
  label,
  active,
  onPress,
  icon,
  color,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: IconName;
  color?: string;
}) {
  const accent = color ?? colors.purple[400];
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className="flex-row items-center gap-1.5 rounded-full px-3 py-1.5 active:opacity-70"
      style={{
        borderWidth: 1,
        borderColor: active ? accent : colors.border,
        backgroundColor: active ? colors.overlayPurpleSoft : 'transparent',
      }}
    >
      {icon && <Icon name={icon} size={12} color={active ? accent : colors.gray[400]} />}
      <Caption
        style={{
          color: active ? accent : colors.gray[400],
          fontWeight: active ? '600' : '400',
        }}
      >
        {label}
      </Caption>
    </Pressable>
  );
}
