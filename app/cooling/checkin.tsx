import { useState } from 'react';
import { View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useCoolingStore } from '@/store/useCoolingStore';
import { addCheckinResponse } from '@/api/graduation';
import { fetchCoolingCheckinGPTResponse } from '@/api/ai';
import { formatDateStr } from '@/utils/dateUtils';
import { colors } from '@/constants/colors';

function getCoolingDay(requestedAt: string | null): number {
  if (!requestedAt) return 1;
  const diff = Math.floor((Date.now() - new Date(requestedAt).getTime()) / (24 * 60 * 60 * 1000));
  return Math.min(7, diff + 1);
}

export default function CoolingCheckinScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { id, requestedAt } = useCoolingStore();

  const coolingDay = getCoolingDay(requestedAt);

  async function handleSave() {
    if (!text.trim() || !id) return;
    setLoading(true);
    try {
      const checkinData = { text: text.trim(), date: formatDateStr(new Date()) };
      await addCheckinResponse(id, checkinData);

      // GPT 응답 호출 (Edge Function, fallback 포함)
      const aiResponse = await fetchCoolingCheckinGPTResponse({
        day: coolingDay,
        checkinText: text.trim(),
      });

      router.push({
        pathname: '/cooling/checkin/response' as never,
        params: { response: aiResponse, day: String(coolingDay) },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">자율 체크인 · Day {coolingDay}</Caption>
        <Heading className="mb-2">지금 마음이 어때?</Heading>
        <Body className="text-gray-400 mb-8">
          강요 없이, 지금 느끼��� 걸 그대로 써봐. 기록은 보존돼.
        </Body>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="지금 이 순간의 솔직한 마음을..."
          placeholderTextColor={colors.gray[600]}
          multiline
          autoFocus
          accessibilityLabel="자율 체크인 입력"
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 200 }}
        />
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label={loading ? '잠깐...' : '저장하기'}
          onPress={handleSave}
          loading={loading}
          disabled={!text.trim()}
        />
        <PrimaryButton label="다음에 할게" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
