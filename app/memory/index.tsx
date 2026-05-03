import { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useJournalStore } from '@/store/useJournalStore';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  isMemoryGlamourBlocked,
  getMemoryReflectGateDays,
} from '@/constants/personaBranches';

interface CategoryOption {
  id: 'happy' | 'miss' | 'painful' | 'growth';
  label: string;
  color: string;
  /** true면 *미화 위험* 카테고리 — P01·P10·P14·P20에서 차단 */
  glamourRisk: boolean;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'happy',   label: '행복했던 순간',  color: colors.teal[400],   glamourRisk: true  },
  { id: 'miss',    label: '지금도 그리운 것', color: colors.purple[400], glamourRisk: true  },
  { id: 'painful', label: '아팠던 순간',    color: colors.coral[400],  glamourRisk: false },
  { id: 'growth',  label: '성장한 부분',    color: colors.amber[400],  glamourRisk: false },
];

export default function MemoryIndexScreen() {
  const { entries } = useJournalStore();
  const { daysElapsed } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const [selected, setSelected] = useState<string | null>(null);

  // C-2-G-7a: 페르소나별 미화 차단·D+N 게이트 (매트릭스 §2 C7)
  const glamourBlocked = isMemoryGlamourBlocked(personaPrimary);
  const reflectGateDays = getMemoryReflectGateDays(personaPrimary);
  const reflectUnlocked = daysElapsed >= reflectGateDays;
  const reflectDaysLeft = Math.max(0, reflectGateDays - daysElapsed);

  const moodScores = entries.slice(0, 7).map((e) => e.moodScore);
  const avg = moodScores.length
    ? (moodScores.reduce((a, b) => a + b, 0) / moodScores.length).toFixed(1)
    : null;

  function handleStart() {
    if (!selected) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/memory/write' as any, params: { category: selected } });
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} className="mb-6 self-start">
          <Icon name="chevron-left" size={20} color={colors.gray[400]} />
        </Pressable>

        <Heading className="mb-2">추억 돌아보기</Heading>
        <Body className="text-gray-400 mb-8">
          그 관계의 어떤 부분을 돌아보고 싶어?{'\n'}
          기억은 사라지지 않아. 다만 다르게 느껴질 뿐이야.
        </Body>

        {avg && (
          <Card variant="subtle" accent="purple" className="mb-8">
            <Caption className="text-purple-400">
              최근 감정 온도 평균 {avg}° — 이 기억들이 그 온도를 만들었을 거야.
            </Caption>
          </Card>
        )}

        {/* C-2-G-7a: D+N 게이트 안내 (P03 등) */}
        {!reflectUnlocked && (
          <Card className="mb-6 p-4">
            <View className="flex-row items-start gap-3">
              <Icon name="hourglass" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">{reflectDaysLeft}일 뒤에 다시 만나자</Body>
                <Caption className="text-gray-400 leading-5">
                  지금은 회상이 그리움을 자극할 수 있는 시기야. 조금만 더 자기 자신을 살피자.
                </Caption>
              </View>
            </View>
          </Card>
        )}

        {/* C-2-G-7a: 미화 차단 안내 (P01·P10·P14·P20) */}
        {reflectUnlocked && glamourBlocked && (
          <Card className="mb-6 p-4">
            <View className="flex-row items-start gap-3">
              <Icon name="shield" size={18} color={colors.purple[400]} />
              <View className="flex-1">
                <Body className="font-medium mb-1">미화 회상은 닫아뒀어</Body>
                <Caption className="text-gray-400 leading-5">
                  지금 *행복했던 순간*·*그리움*을 떠올리면 사실을 흐리게 만들 수 있어.
                  *아팠던 순간*과 *성장한 부분*만 함께 보자.
                </Caption>
              </View>
            </View>
          </Card>
        )}

        <View className="gap-3 mb-8">
          {CATEGORY_OPTIONS.map((opt) => {
            const blocked = !reflectUnlocked || (glamourBlocked && opt.glamourRisk);
            const isSelected = selected === opt.id && !blocked;
            return (
              <Pressable
                key={opt.id}
                onPress={() => { if (!blocked) setSelected(opt.id); }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: blocked }}
                disabled={blocked}
                style={{ opacity: blocked ? 0.4 : 1 }}
              >
                <Card
                  variant={isSelected ? 'accent' : 'default'}
                  className="flex-row items-center justify-between"
                >
                  <Body
                    className="font-medium"
                    style={{ color: isSelected ? opt.color : colors.gray[400] }}
                  >
                    {opt.label}
                  </Body>
                  {isSelected && <Icon name="check" size={18} color={opt.color} />}
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="기억 꺼내보기"
          onPress={handleStart}
          disabled={!selected}
        />
        <PrimaryButton
          label="홈으로"
          variant="ghost"
          onPress={() => router.replace('/(tabs)')}
        />
      </View>
    </ScreenWrapper>
  );
}
