import { useState } from 'react';
import { View, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';

export default function AnalysisRolePartnerScreen() {
  const [catchReasons, setCatchReasons] = useState('');
  const [letGoReasons, setLetGoReasons] = useState('');

  const canProceed = catchReasons.trim().length > 0 || letGoReasons.trim().length > 0;

  function handleNext() {
    router.push('/analysis/stay-leave');
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
          <Caption className="mb-2">관계 분석 · 3 / 5</Caption>
          <Heading className="mb-2">마음속 두 목소리</Heading>
          <Body className="text-gray-400 mb-8">
            다시 잡고 싶은 이유와 보내야 할 이유, 둘 다 솔직하게 적어봐. 하나만 있어도 괜찮아.
          </Body>

          <Card variant="subtle" accent="purple" className="mb-4">
            <Caption className="text-purple-400 mb-3">다시 잡아야 하는 이유</Caption>
            <TextInput
              value={catchReasons}
              onChangeText={setCatchReasons}
              placeholder="아직 마음이 남아있는 이유..."
              placeholderTextColor={colors.gray[600]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-white text-base"
              style={{ minHeight: 90, color: colors.white }}
            />
          </Card>

          <Card variant="subtle" accent="teal" className="mb-8">
            <Caption className="text-teal-400 mb-3">이제 보내야 하는 이유</Caption>
            <TextInput
              value={letGoReasons}
              onChangeText={setLetGoReasons}
              placeholder="새로운 길로 가야 하는 이유..."
              placeholderTextColor={colors.gray[600]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="text-white text-base"
              style={{ minHeight: 90, color: colors.white }}
            />
          </Card>

          {(catchReasons.trim() || letGoReasons.trim()) && (
            <Card className="mb-4">
              <Caption className="text-gray-500 mb-1">지금 이 순간의 기록</Caption>
              <Body className="text-gray-400 text-sm leading-relaxed">
                두 마음이 공존한다는 게 정상이야. 어느 쪽이 더 강한지, 천천히 느껴봐.
              </Body>
            </Card>
          )}

          <ProgressDots total={5} current={2} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="px-6 pb-10">
        <PrimaryButton label="다음" onPress={handleNext} disabled={!canProceed} />
      </View>
    </ScreenWrapper>
  );
}
