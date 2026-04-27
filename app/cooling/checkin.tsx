import { useState } from 'react';
import { Text, View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useCoolingStore } from '@/store/useCoolingStore';
import { addCheckinResponse } from '@/api/graduation';
import { formatDateStr } from '@/utils/dateUtils';

export default function CoolingCheckinScreen() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const { id } = useCoolingStore();

  async function handleSave() {
    if (!text.trim() || !id) return;
    setLoading(true);
    try {
      const response = { text: text.trim(), date: formatDateStr(new Date()) };
      await addCheckinResponse(id, response);
      router.back();
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">자율 체크인</Text>
        <Text className="text-white text-2xl font-bold mb-2">지금 마음이 어때?</Text>
        <Text className="text-gray-400 text-sm mb-8">
          강요 없이, 지금 느끼는 걸 그대로 써봐. 기록은 보존돼.
        </Text>

        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="지금 이 순간의 솔직한 마음을..."
          placeholderTextColor="#5F5E5A"
          multiline
          autoFocus
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 200 }}
        />
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="저장하기" onPress={handleSave} loading={loading} disabled={!text.trim()} />
        <PrimaryButton label="다음에 할게" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenWrapper>
  );
}
