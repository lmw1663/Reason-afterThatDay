import { useState } from 'react';
import { Text, View, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
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
    router.push('/analysis/stay-leave');
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">관계 분석 · 2 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-6">
          그 사람의 장단점은?
        </Text>

        {/* 탭 */}
        <View className="flex-row mb-6 rounded-xl overflow-hidden" style={{ backgroundColor: '#1A1A22' }}>
          {(['pros', 'cons'] as Tab[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              className="flex-1 py-3 items-center"
              style={tab === t ? { backgroundColor: '#534AB7' } : {}}
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
            placeholderTextColor="#5F5E5A"
            returnKeyType="done"
            className="flex-1 text-white text-base px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#1A1A22' }}
          />
          <Pressable
            onPress={addItem}
            className="px-4 py-3 rounded-xl items-center justify-center"
            style={{ backgroundColor: '#534AB7' }}
          >
            <Text className="text-white font-bold">+</Text>
          </Pressable>
        </View>

        {/* 리스트 */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {list.map((item) => (
            <View
              key={item}
              className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2"
              style={{ backgroundColor: '#1A1A22' }}
            >
              <Text className="text-white flex-1">{item}</Text>
              <Pressable onPress={() => removeItem(item)}>
                <Text className="text-gray-600 text-lg ml-3">×</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={1} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}
