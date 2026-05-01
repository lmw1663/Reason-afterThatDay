import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, TextInput, Pressable, ScrollView } from 'react-native';
import { router, type Href } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { useRelationshipStore } from '@/store/useRelationshipStore';

type Tab = 'pros' | 'cons';

export default function AnalysisProsCons() {
  const { profile, updateField } = useRelationshipStore();
  const [tab, setTab] = useState<Tab>('pros');
  const [pros, setPros] = useState<string[]>(profile.pros);
  const [cons, setCons] = useState<string[]>(profile.cons);
  const [input, setInput] = useState('');

  const list = tab === 'pros' ? pros : cons;
  const setList = tab === 'pros' ? setPros : setCons;

  function addItem() {
    const trimmed = input.trim();
    if (!trimmed || list.includes(trimmed)) return;
    setList((prev) => [...prev, trimmed]);
    setInput('');
  }

  function removeItem(item: string) {
    setList((prev) => prev.filter((x) => x !== item));
  }

  function handleNext() {
    updateField('pros', pros);
    updateField('cons', cons);
    router.push('/analysis/role-partner' as Href);
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">관계 분석 · 2 / 5</Caption>
        <Heading className="mb-6">그 사람의 장단점은?</Heading>

        {/* 탭 */}
        <View
          className="flex-row mb-6 rounded-xl overflow-hidden bg-surface"
          accessibilityRole="tablist"
        >
          {(['pros', 'cons'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTab(t); setInput(''); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t }}
              accessibilityLabel={t === 'pros' ? `장점 탭, ${pros.length}개` : `단점 탭, ${cons.length}개`}
              className="flex-1 py-3 items-center"
              style={tab === t ? { backgroundColor: colors.purple[600] } : undefined}
            >
              <Text className={tab === t ? 'text-white font-semibold' : 'text-gray-400'}>
                {t === 'pros' ? `장점 (${pros.length})` : `단점 (${cons.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

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
