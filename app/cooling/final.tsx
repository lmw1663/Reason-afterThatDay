import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useUserStore } from '@/store/useUserStore';
import { confirmGraduation, resetCooling } from '@/api/graduation';

export default function CoolingFinalScreen() {
  const [loading, setLoading] = useState(false);
  const { id, updateStatus } = useCoolingStore();
  const { userId } = useUserStore();

  async function handleConfirm() {
    if (!id || !userId) return;
    setLoading(true);
    try {
      await confirmGraduation(userId, id);
      updateStatus('confirmed');
      router.replace('/(tabs)/graduation');
    } finally {
      setLoading(false);
    }
  }

  async function handleExtend() {
    if (!id) return;
    setLoading(true);
    try {
      // 7일 연장 — requested_at 재설정, notifications_sent 리셋, checkin 보존
      await resetCooling(id);
      router.replace('/cooling');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">Day 7</Text>
        <Text className="text-white text-2xl font-bold mb-2">최종 확인</Text>
        <Text className="text-gray-400 text-sm mb-10 leading-relaxed">
          7일이 지났어. 지금 어떤 마음이야?
        </Text>

        <View className="rounded-2xl p-6 mb-6" style={{ backgroundColor: '#1A1A22' }}>
          <Text className="text-white text-base leading-loose text-center">
            이 이별을 통해 성장한 나를 인정하고,{'\n'}
            새로운 시작을 향해 한 발 내딛을게.
          </Text>
        </View>

        <View
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: 'rgba(127,119,221,0.08)', borderWidth: 1, borderColor: '#3C3489' }}
        >
          <Text className="text-purple-400 text-sm text-center leading-relaxed">
            졸업 후에도 언제든 돌아올 수 있어.{'\n'}
            이건 끝이 아니라 새로운 페이지야.
          </Text>
        </View>
      </View>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton
          label="🎓 졸업할게"
          onPress={handleConfirm}
          loading={loading}
        />
        <PrimaryButton
          label="아직 아니야, 7일 더 생각해볼게"
          variant="ghost"
          onPress={handleExtend}
          loading={loading}
        />
      </View>
    </ScreenWrapper>
  );
}
