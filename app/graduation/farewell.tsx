import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { useCoolingStore } from '@/store/useCoolingStore';
import { fetchGraduationFarewellResponse } from '@/api/ai';
import { colors } from '@/constants/colors';

export default function GraduationFarewellScreen() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { userId } = useUserStore();
  const { id: coolingPeriodId } = useCoolingStore();

  async function handleSubmit() {
    if (!message.trim()) return;
    setLoading(true);
    try {
      await fetchGraduationFarewellResponse({
        userId: userId ?? '',
        coolingPeriodId: coolingPeriodId ?? '',
        farewellMessage: message.trim(),
      });
      router.push({
        pathname: '/graduation/farewell/response' as never,
        params: { coolingPeriodId: coolingPeriodId ?? '' },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">졸업 · 4 / 5</Caption>
        <Heading className="mb-2">너의 마지막 한 줄</Heading>
        <Body className="text-gray-400 mb-8 leading-relaxed">
          상대에게, 또는 과거의 너 자신에게{'\n'}
          마지막으로 하고 싶은 말을 한 줄로 적어줘.
        </Body>

        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="예: 고마워. 이제 나를 좋아해줄 사람을 찾을 거야."
          placeholderTextColor={colors.gray[600]}
          multiline={false}
          maxLength={80}
          autoFocus
          accessibilityLabel="작별 한 줄 입력"
          className="text-white text-base px-4 py-3 rounded-xl bg-surface"
        />
        <Caption className="text-gray-600 text-right mt-1">{message.length}/80</Caption>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={loading ? '잠깐...' : '저장하기'}
          onPress={handleSubmit}
          loading={loading}
          disabled={!message.trim()}
        />
        <PrimaryButton
          label="건너뛸게"
          variant="ghost"
          onPress={() => router.push('/graduation/confirm')}
        />
      </View>
    </ScreenWrapper>
  );
}
