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

// G-7c-5: P18 사회적 얽힘 사용자를 위한 *마주침 동선 정리* (매트릭스 §2 C7 line 316).
// 추억 정리 대신 *일상 트리거 정리*로 변형 — 마주침 시간/장소/계획을 미리 적어두는 통제감 회복.
// 화면 텍스트엔 페르소나 코드/명칭 노출 금지.

const STORAGE_KEY = 'memory_encounter_plan_v1';

type EncounterContext = 'work' | 'social' | 'place';

interface EncounterEntry {
  id: string;
  trigger: string;
  context: EncounterContext;
  plan: string;
  createdAt: number;
}

interface ContextMeta {
  id: EncounterContext;
  label: string;
  short: string;
  icon: IconName;
}

const CONTEXT_META: Record<EncounterContext, ContextMeta> = {
  work:   { id: 'work',   label: '직장·일정',     short: '직장',   icon: 'briefcase' },
  social: { id: 'social', label: '모임·공통 친구', short: '모임',   icon: 'users' },
  place:  { id: 'place',  label: '자주 가는 장소',  short: '장소',   icon: 'map-pin' },
};

const CONTEXT_ORDER: EncounterContext[] = ['work', 'social', 'place'];

export default function MemoryEncounterPlanScreen() {
  const [entries, setEntries] = useState<EncounterEntry[]>([]);
  const [trigger, setTrigger] = useState('');
  const [context, setContext] = useState<EncounterContext>('work');
  const [plan, setPlan] = useState('');
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<EncounterContext | 'all'>('all');
  const toast = useRef(new Animated.Value(0)).current;

  useScreenView('memory_encounter_plan');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as EncounterEntry[];
        setEntries(parsed.sort((a, b) => b.createdAt - a.createdAt));
      } catch {
        // 손상된 데이터는 무시
      }
    });
  }, []);

  async function handleAdd() {
    const trimmed = trigger.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const entry: EncounterEntry = {
      id: `ep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      trigger: trimmed,
      context,
      plan: plan.trim(),
      createdAt: Date.now(),
    };
    const next = [entry, ...entries];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
      setTrigger('');
      setPlan('');
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

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.context === filter);
  const counts: Record<EncounterContext, number> = {
    work: entries.filter((e) => e.context === 'work').length,
    social: entries.filter((e) => e.context === 'social').length,
    place: entries.filter((e) => e.context === 'place').length,
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

        <Heading className="mb-2">마주칠 일상 정리</Heading>
        <Body className="text-gray-400 mb-3">
          예측할 수 있으면 덜 흔들려.
        </Body>
        <Caption className="text-gray-500 mb-6 leading-5">
          마주칠 가능성이 있는 시간·장소·자리와 그때 어떻게 할지 미리 적어두자.{'\n'}
          이 기기에 보관돼 — 너 혼자 보는 메모야.
        </Caption>

        <Card className="mb-4">
          <Caption className="text-gray-500 mb-3">마주칠 일</Caption>
          <TextInput
            value={trigger}
            onChangeText={setTrigger}
            placeholder="예: 월요일 팀 회의 / 동아리 송년회 / 자주 가던 카페..."
            placeholderTextColor={colors.gray[600]}
            maxLength={120}
            accessibilityLabel="마주침 트리거"
            className="text-white text-base px-4 py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          />

          <Caption className="text-gray-500 mb-2">어디서?</Caption>
          <View className="gap-2 mb-3">
            {CONTEXT_ORDER.map((c) => {
              const meta = CONTEXT_META[c];
              const selected = context === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setContext(c)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  className="flex-row items-center gap-3 rounded-xl px-3 py-2.5 active:opacity-70"
                  style={{
                    borderWidth: 1,
                    borderColor: selected ? colors.purple[400] : colors.border,
                    backgroundColor: selected ? colors.overlayPurpleSoft : 'transparent',
                  }}
                >
                  <Icon
                    name={meta.icon}
                    size={16}
                    color={selected ? colors.purple[400] : colors.gray[400]}
                  />
                  <Body
                    style={{
                      color: selected ? colors.purple[400] : colors.gray[400],
                      fontWeight: selected ? '600' : '400',
                    }}
                  >
                    {meta.label}
                  </Body>
                </Pressable>
              );
            })}
          </View>

          <Caption className="text-gray-500 mb-2">그때 어떻게 할 거야? (선택)</Caption>
          <TextInput
            value={plan}
            onChangeText={setPlan}
            placeholder="예: 10분 전 자리 떠나기 / 짧게 인사만 하고 빠지기 / 친구 옆자리..."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={250}
            textAlignVertical="top"
            accessibilityLabel="사전 계획"
            className="text-white text-sm px-4 py-3 rounded-xl mb-3"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 60,
            }}
          />

          <PrimaryButton
            label={saving ? '추가 중...' : '예측표에 추가'}
            leftIcon="plus"
            onPress={handleAdd}
            loading={saving}
            disabled={!trigger.trim()}
          />
        </Card>

        {entries.length > 0 && (
          <View className="mt-2 mb-3 flex-row flex-wrap gap-2">
            <FilterChip
              label={`전체 ${entries.length}`}
              active={filter === 'all'}
              onPress={() => setFilter('all')}
            />
            {CONTEXT_ORDER.map((c) => {
              if (counts[c] === 0) return null;
              const meta = CONTEXT_META[c];
              return (
                <FilterChip
                  key={c}
                  label={`${meta.short} ${counts[c]}`}
                  icon={meta.icon}
                  active={filter === c}
                  onPress={() => setFilter(c)}
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
              const meta = CONTEXT_META[e.context];
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
                      <Icon name={meta.icon} size={14} color={colors.purple[400]} />
                      <Caption className="text-purple-400 font-medium">{meta.short}</Caption>
                    </View>
                    <Caption className="text-gray-600">
                      {formatDateStr(new Date(e.createdAt))}
                    </Caption>
                  </View>
                  <Body className="text-gray-200 leading-relaxed">{e.trigger}</Body>
                  {e.plan ? (
                    <Caption className="text-gray-500 mt-2 leading-5">→ {e.plan}</Caption>
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
          <Body className="text-purple-400">예측표에 적어뒀어</Body>
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
}: {
  label: string;
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
      {icon && <Icon name={icon} size={12} color={active ? colors.purple[400] : colors.gray[400]} />}
      <Caption
        style={{
          color: active ? colors.purple[400] : colors.gray[400],
          fontWeight: active ? '600' : '400',
        }}
      >
        {label}
      </Caption>
    </Pressable>
  );
}
