import { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';

const CATEGORY_META: Record<string, { label: string; prompt: string; question: string; color: string }> = {
  happy: {
    label: '행복했던 순간',
    prompt: '같이 있어서 좋았던 기억을 꺼내봐.',
    question: '그 순간 어떤 감정이었어?',
    color: colors.teal[400],
  },
  miss: {
    label: '지금도 그리운 것',
    prompt: '지금 가장 그리운 게 뭐야?',
    question: '그게 왜 그리운 것 같아?',
    color: colors.purple[400],
  },
  painful: {
    label: '아팠던 순간',
    prompt: '가장 힘들었던 순간을 떠올려봐.',
    question: '그때 나에게 해주고 싶은 말이 있어?',
    color: colors.coral[400],
  },
  growth: {
    label: '성장한 부분',
    prompt: '이 관계를 통해 달라진 나의 모습은?',
    question: '그 변화가 앞으로 어떻게 도움이 될 것 같아?',
    color: colors.amber[400],
  },
};

export default function MemoryWriteScreen() {
  const { category } = useLocalSearchParams<{ category: string }>();
  const meta = CATEGORY_META[category] ?? CATEGORY_META['happy'];

  const [memory, setMemory] = useState('');
  const [feeling, setFeeling] = useState('');

  const canProceed = memory.trim().length > 0;

  function handleNext() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: '/memory/reflect' as any, params: { category, memory, feeling } });
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1 px-6 pt-14"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <BackHeader />
          <Caption className="mb-2" style={{ color: meta.color }}>{meta.label}</Caption>
          <Heading className="mb-2">기억을 꺼내봐</Heading>
          <Body className="text-gray-400 mb-8">{meta.prompt}</Body>

          <View className="mb-8">
            <TextInput
              value={memory}
              onChangeText={setMemory}
              placeholder="그 기억을 떠올리며 적어봐..."
              placeholderTextColor={colors.gray[600]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              className="text-white text-base px-4 py-4 rounded-xl bg-surface"
              style={{ minHeight: 120 }}
            />
          </View>

          {memory.trim().length > 0 && (
            <View className="mb-6">
              <Body className="text-white font-medium mb-3">{meta.question}</Body>
              <TextInput
                value={feeling}
                onChangeText={setFeeling}
                placeholder="솔직하게 적어봐..."
                placeholderTextColor={colors.gray[600]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className="text-white text-base px-4 py-3 rounded-xl bg-surface"
                style={{ minHeight: 80 }}
              />
            </View>
          )}

          {memory.trim().length > 30 && (
            <Card variant="subtle" accent="purple" className="mb-4">
              <Caption className="text-purple-400 leading-relaxed">
                기억을 꺼내는 것만으로도 용기야. 그 기억이 너를 만든 일부야.
              </Caption>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="다음 — 마음 정리"
          onPress={handleNext}
          disabled={!canProceed}
        />
      </View>
    </ScreenWrapper>
  );
}
