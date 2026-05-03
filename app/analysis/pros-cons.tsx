import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, TextInput, Pressable, ScrollView } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { useUserStore } from '@/store/useUserStore';
import { usePersonaStore } from '@/store/usePersonaStore';
import {
  isPartnerProsBlocked,
  isPartnerConsBlocked,
  getProsConsItemLimit,
} from '@/constants/personaBranches';
import { Card } from '@/components/ui/Card';

type Tab = 'pros' | 'cons';

function getDayContextMessage(daysElapsed: number, tab: Tab): string | null {
  if (tab === 'cons' && daysElapsed < 15) {
    return '지금은 단점보다 장점이 더 잘 떠오르는 시기야. 그래도 괜찮아.';
  }
  if (daysElapsed < 15) {
    return '아직 초기라서 상대방의 좋은 점들이 많이 떠오를 거야. 그것도 너의 정직한 마음이야.';
  }
  if (daysElapsed < 30) {
    return '이제 양쪽을 더 균형 있게 봐야 할 때야. 전에 못 봤던 단점들도 보이기 시작할 거야.';
  }
  return '전에 입력했던 내용을 다시 봐볼까? 지금은 어떻게 보여?';
}

export default function AnalysisProsCons() {
  const { profile, updateField } = useRelationshipStore();
  const { daysElapsed } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);

  // C-2-G-6: 페르소나별 탭 차단·항목 상한
  const prosBlocked = isPartnerProsBlocked(personaPrimary);   // P01·P20
  const consBlocked = isPartnerConsBlocked(personaPrimary);   // P14
  const itemLimit = getProsConsItemLimit(personaPrimary);     // P19=7, 그 외=Infinity

  // 차단되지 않은 첫 탭으로 default
  const initialTab: Tab = prosBlocked && !consBlocked ? 'cons' : 'pros';

  const [tab, setTab] = useState<Tab>(initialTab);
  const [pros, setPros] = useState<string[]>(profile.pros);
  const [cons, setCons] = useState<string[]>(profile.cons);
  const [input, setInput] = useState('');

  const list = tab === 'pros' ? pros : cons;
  const setList = tab === 'pros' ? setPros : setCons;
  const contextMessage = getDayContextMessage(daysElapsed, tab);
  const dayKey = `D+${daysElapsed}`;

  // 현재 탭이 차단됐는지 (탭 누름과 별개로 안전망)
  const currentTabBlocked = (tab === 'pros' && prosBlocked) || (tab === 'cons' && consBlocked);
  const limitReached = list.length >= itemLimit;

  function addItem() {
    const trimmed = input.trim();
    if (!trimmed || list.includes(trimmed)) return;
    if (limitReached) return;
    setList((prev) => [...prev, trimmed]);
    setInput('');
  }

  function removeItem(item: string) {
    setList((prev) => prev.filter((x) => x !== item));
  }

  function handleNext() {
    updateField('pros', pros);
    updateField('cons', cons);
    // 시점별 누적 (prosByDate/consByDate)
    const existingPros = { ...profile.prosByDate, [dayKey]: pros };
    const existingCons = { ...profile.consByDate, [dayKey]: cons };
    updateField('prosByDate', existingPros);
    updateField('consByDate', existingCons);
    router.push('/analysis/role-partner' as Href);
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">관계 분석 · 2 / 5</Caption>
        <Heading className="mb-4">그 사람의 장단점은?</Heading>

        {/* 시점별 안내 메시지 */}
        {contextMessage && (
          <Body className="text-gray-400 text-sm mb-4 leading-relaxed">
            {contextMessage}
          </Body>
        )}

        {/* 탭 — 페르소나별 차단 (C-2-G-6) */}
        <View
          className="flex-row mb-6 rounded-xl overflow-hidden bg-surface"
          accessibilityRole="tablist"
        >
          {(['pros', 'cons'] as Tab[]).map((t) => {
            const blocked = (t === 'pros' && prosBlocked) || (t === 'cons' && consBlocked);
            return (
              <Pressable
                key={t}
                onPress={() => { if (!blocked) { setTab(t); setInput(''); } }}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === t, disabled: blocked }}
                accessibilityLabel={t === 'pros' ? `장점 탭, ${pros.length}개` : `단점 탭, ${cons.length}개`}
                disabled={blocked}
                className="flex-1 py-3 items-center"
                style={{
                  backgroundColor: tab === t && !blocked ? colors.purple[600] : undefined,
                  opacity: blocked ? 0.4 : 1,
                }}
              >
                <Text className={tab === t && !blocked ? 'text-white font-semibold' : 'text-gray-400'}>
                  {t === 'pros' ? `장점 (${pros.length})` : `단점 (${cons.length})`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 차단된 탭 안내 (P01·P14·P20) */}
        {currentTabBlocked && (
          <Card className="mb-4 p-4">
            <Body className="text-gray-300 text-sm leading-6">
              지금은 이 탭을 닫아뒀어. 균형이 아니라 *너의 안전*이 먼저야.
            </Body>
          </Card>
        )}

        {/* 항목 상한 안내 (P19) */}
        {Number.isFinite(itemLimit) && limitReached && !currentTabBlocked && (
          <Card className="mb-4 p-4">
            <Body className="text-gray-300 text-sm leading-6">
              {itemLimit}개면 충분해. 더 추가하는 건 *생각을 정리*하는 게 아니라
              *반복하는 것*에 가까워.
            </Body>
          </Card>
        )}

        {/* 입력 */}
        <View className="flex-row gap-2 mb-4">
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={addItem}
            placeholder={tab === 'pros' ? '좋았던 점 추가...' : '아쉬웠던 점 추가...'}
            placeholderTextColor={colors.gray[600]}
            returnKeyType="done"
            accessibilityLabel={tab === 'pros' ? '장점 추가' : '단점 추가'}
            className="flex-1 text-white text-base px-4 py-3 rounded-xl bg-surface"
          />
          <Pressable
            onPress={addItem}
            accessibilityRole="button"
            accessibilityLabel="추가"
            className="px-4 py-3 rounded-xl items-center justify-center bg-purple-600"
          >
            <Icon name="plus" size={20} color={colors.white} strokeWidth={2.4} />
          </Pressable>
        </View>

        {/* 리스트 */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {list.map((item) => (
            <View
              key={item}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2 bg-surface"
            >
              <Text className="text-white flex-1">{item}</Text>
              <Pressable
                onPress={() => removeItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`${item} 삭제`}
                className="ml-3"
              >
                <Icon name="x" size={18} color={colors.gray[600]} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={5} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
