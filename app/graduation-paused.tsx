import { View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';

/**
 * 졸업 트랙 보류 안내 — A-4
 *
 * 사용자가 명시적으로 "졸업 일단 빼자"고 결정. 매트릭스 §2 C9 셀은 문서엔 보존하되
 * 코드는 미적용. 임상 재검증 후 페르소나별 졸업 흐름을 별도 설계.
 *
 * 본 화면은 졸업 진입 모든 경로의 *최종 안내 화면*이다:
 * - app/graduation/_layout.tsx → 모든 graduation/* 진입을 여기로 redirect
 * - app/(tabs)/graduation.tsx → URL 직접 진입을 여기로 redirect
 * - app/cooling/final.tsx → 7일 후 confirm을 여기로 redirect
 */
export default function GraduationPausedScreen() {
  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-24">
        <Caption className="mb-2">잠시 멈춤</Caption>
        <Display className="mb-2">졸업은 잠시 보류 중이야</Display>
        <Body className="text-gray-400 mb-8">
          더 안전한 마무리 흐름을 만들기 위해 잠시 멈췄어.{'\n'}
          준비되는 대로 알려줄게.
        </Body>

        <Card className="p-5 mb-4">
          <View className="flex-row items-start gap-3">
            <Icon name="hourglass" size={20} color={colors.purple[400]} />
            <View className="flex-1">
              <Body className="font-medium mb-1">왜 멈췄어?</Body>
              <Caption className="text-gray-400 leading-5">
                사람마다 마무리가 필요한 시점·방식이 달라. 누군가에겐 "졸업"이 아닌
                "수용"이나 "단절 카운터"가 더 맞기도 해. 너에게 맞는 흐름을 다시 설계 중이야.
              </Caption>
            </View>
          </View>
        </Card>

        <Card className="p-5">
          <View className="flex-row items-start gap-3">
            <Icon name="heart" size={20} color={colors.purple[400]} />
            <View className="flex-1">
              <Body className="font-medium mb-1">그동안 너의 기록은</Body>
              <Caption className="text-gray-400 leading-5">
                일기·추억·생각은 그대로 [기록] 탭에 남아 있어. 천천히 다시 들여다봐도 돼.
              </Caption>
            </View>
          </View>
        </Card>
      </View>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="홈으로 돌아가기"
          onPress={() => router.replace('/(tabs)' as never)}
        />
      </View>
    </ScreenWrapper>
  );
}
