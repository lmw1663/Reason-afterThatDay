import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { supabase } from '@/api/supabase';

export default function GraduationFarewellResponseScreen() {
  const { coolingPeriodId } = useLocalSearchParams<{ coolingPeriodId: string }>();
  const [farewell, setFarewell] = useState<{ user_message: string; ai_response: string } | null>(null);

  useEffect(() => {
    if (!coolingPeriodId) return;
    supabase
      .from('graduation_farewell')
      .select('user_message, ai_response')
      .eq('cooling_period_id', coolingPeriodId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFarewell(data as { user_message: string; ai_response: string });
        }
      });
  }, [coolingPeriodId]);

  if (!farewell) return <LoadingOverlay visible message="잠깐만..." />;

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Caption className="mb-2">졸업 · 4 / 5</Caption>
        <Heading className="mb-8">너의 작별에 답할게</Heading>

        {/* AI 응답 메인 — 화면 전환형 UX, 채팅 패턴 회피 */}
        <InsightCard
          tag="너에게"
          body={farewell.ai_response}
          accent="purple"
        />

        {/* 사용자 메시지는 작은 캡션 — 회상용, 입력창과 동시 노출 X */}
        <Caption className="text-gray-600 mt-4 text-center">
          너의 한 줄: "{farewell.user_message}"
        </Caption>

        {/* 6-11 hook — 졸업 후 자기 성찰 안내 */}
        <Card className="mt-8 border border-gray-700">
          <Body className="text-gray-300 mb-1">졸업 후에도 너에 대해</Body>
          <Caption className="text-gray-500 mb-3">더 알아갈 수 있어.</Caption>
          <PrimaryButton
            label="나에 대해 알아가기 →"
            variant="ghost"
            onPress={() => router.push('/about-me' as never)}
          />
        </Card>
      </View>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="졸업 확인하기"
          onPress={() => router.push('/graduation/confirm')}
        />
      </View>
    </ScreenWrapper>
  );
}
