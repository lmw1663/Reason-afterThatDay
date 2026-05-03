import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon, type IconName } from '@/components/ui/Icon';
import { CoolingOffWarningModal } from '@/components/CoolingOffWarningModal';
import { useUserStore } from '@/store/useUserStore';
import { fetchCurrentReflections, type ReflectionCategory, type SelfReflection } from '@/api/selfReflections';
import { colors } from '@/constants/colors';

const CATEGORIES: { key: ReflectionCategory; icon: IconName; title: string; desc: string }[] = [
  { key: 'love_self',                 icon: 'users',            title: '연애에서의 나',    desc: '연애할 때 어떤 사람이었어?' },
  { key: 'ideal_match',               icon: 'puzzle',           title: '이상적 매칭',      desc: '어떤 사람이랑 잘 맞아?' },
  { key: 'self_love',                 icon: 'heart-handshake',  title: '자기애 측정',      desc: '나를 얼마나 사랑해?' },
  { key: 'strengths',                 icon: 'sparkles',         title: '강점 발견',        desc: '나의 장점이 뭐야?' },
  { key: 'self_care_in_relationship', icon: 'coffee',           title: '연애 중 자기 돌봄', desc: '연애할 때 뭐로 스트레스 풀었어?' },
  { key: 'self_care_alone',           icon: 'leaf',             title: '독립 시 자기 돌봄', desc: '혼자 있을 때 뭐로 힘을 얻어?' },
];

export default function AboutMeScreen() {
  const { userId, daysElapsed } = useUserStore();
  const [showCoolingOff, setShowCoolingOff] = useState(false);
  const [reflections, setReflections] = useState<Partial<Record<ReflectionCategory, SelfReflection>>>({});

  useEffect(() => {
    if (daysElapsed < 8) setShowCoolingOff(true);
  }, []);

  // 카테고리 화면에서 저장 후 돌아왔을 때도 완료 상태가 즉시 반영되도록 focus 시 재조회.
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchCurrentReflections(userId).then(setReflections);
      }
    }, [userId]),
  );

  return (
    <ScreenWrapper>
      <CoolingOffWarningModal
        visible={showCoolingOff}
        day={daysElapsed}
        context="self_reflection"
        onProceed={() => setShowCoolingOff(false)}
        onCancel={() => router.back()}
      />

      <ScrollView
        className="flex-1 px-6 pt-14"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <BackHeader />
        <Heading className="mb-1">나에 대해 알아가기</Heading>
        <Caption className="text-gray-500 mb-8">
          답하고 싶은 것만 답해도 돼. 언제든 수정할 수 있어.
        </Caption>

        <View className="flex-row flex-wrap gap-4">
          {CATEGORIES.map((cat) => {
            const answered = !!reflections[cat.key];
            return (
              <Pressable
                key={cat.key}
                onPress={() => router.push(`/about-me/${cat.key}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title} - ${answered ? '답변 완료' : '답변 미완'}`}
                className="rounded-2xl p-4 active:opacity-70"
                style={{
                  width: '47%',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: answered ? colors.purple[600] : colors.border,
                }}
              >
                <View className="mb-2">
                  <Icon
                    name={cat.icon}
                    size={26}
                    color={answered ? colors.purple[400] : colors.gray[400]}
                  />
                </View>
                <Body className="text-white font-semibold mb-1 text-sm">{cat.title}</Body>
                <Caption className="text-gray-500 text-xs mb-2">{cat.desc}</Caption>
                <View className="flex-row items-center gap-1">
                  <Icon
                    name={answered ? 'check' : 'plus'}
                    size={12}
                    color={answered ? colors.purple[400] : colors.gray[600]}
                  />
                  <Caption className={answered ? 'text-purple-400' : 'text-gray-600'}>
                    {answered ? '완료' : '미완'}
                  </Caption>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}
