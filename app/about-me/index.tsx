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
import { usePersonaStore } from '@/store/usePersonaStore';
import { sortAboutMeCategories } from '@/constants/personaBranches';
import { resolvePersona } from '@/utils/personaResolver';
import { useScreenView } from '@/hooks/useScreenView';
import { anonymizePersona } from '@/utils/telemetryHelpers';

const CATEGORIES: { key: ReflectionCategory; icon: IconName; title: string; desc: string }[] = [
  { key: 'love_self',                 icon: 'users',            title: '연애에서의 나',    desc: '연애할 때 어떤 사람이었어?' },
  { key: 'ideal_match',               icon: 'puzzle',           title: '이상적 매칭',      desc: '어떤 사람이랑 잘 맞아?' },
  { key: 'self_love',                 icon: 'heart-handshake',  title: '자기애 측정',      desc: '나를 얼마나 사랑해?' },
  { key: 'strengths',                 icon: 'sparkles',         title: '강점 발견',        desc: '나의 장점이 뭐야?' },
  { key: 'self_care_in_relationship', icon: 'coffee',           title: '연애 중 자기 돌봄', desc: '연애할 때 뭐로 스트레스 풀었어?' },
  { key: 'self_care_alone',           icon: 'leaf',             title: '독립 시 자기 돌봄', desc: '혼자 있을 때 뭐로 힘을 얻어?' },
  // G-5b 신규 — 페르소나 우선 트랙
  { key: 'reality_check',             icon: 'scale',            title: '현실 검증',        desc: '지금 판단을 흐리게 만든 게 뭐야?' },
  { key: 'body',                      icon: 'wind',             title: '몸 살피기',        desc: '잠·식욕·몸의 무게는 어때?' },
  { key: 'needs',                     icon: 'apple',            title: '내 욕구 찾기',     desc: '오늘 너만의 작은 욕구 하나' },
  { key: 'identity',                  icon: 'user',             title: '잃어버린 나',      desc: '관계 안에서 줄어든 너의 부분' },
];

export default function AboutMeScreen() {
  const { userId, daysElapsed } = useUserStore();
  const personaPrimary = usePersonaStore(s => s.primary);
  const personaSecondary = usePersonaStore(s => s.secondary);
  const [showCoolingOff, setShowCoolingOff] = useState(false);
  const [reflections, setReflections] = useState<Partial<Record<ReflectionCategory, SelfReflection>>>({});

  // C-2-G-5a + C-3-H: secondary 페르소나도 검사 (R5 권장형 — effective만)
  // G-5b: 신규 카테고리 4종(reality_check·body·needs·identity) 페르소나 우선 매핑 적용
  const resolved = resolvePersona(personaPrimary, personaSecondary);
  const effectivePersona = resolved.effective;
  const defaultOrder = CATEGORIES.map(c => c.key);
  const sortedKeys = sortAboutMeCategories(defaultOrder, effectivePersona);
  const sortedCategories = sortedKeys
    .map(k => CATEGORIES.find(c => c.key === k))
    .filter((c): c is typeof CATEGORIES[number] => c !== undefined);
  // 권장 카테고리 = 정렬 후 첫 항목이 페르소나 우선 매핑 결과인 경우만 (baseline은 hint 없음)
  const recommendedKey: ReflectionCategory | null =
    effectivePersona && sortedKeys[0] !== defaultOrder[0] ? sortedKeys[0] : null;

  useScreenView('about_me', {
    persona_category: anonymizePersona(effectivePersona),
    has_recommended: recommendedKey !== null,
  });

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
          {sortedCategories.map((cat) => {
            const answered = !!reflections[cat.key];
            // answered + recommended 동시 노출 정책 — 답변 후에도 갱신 진입을 권장하기 위함.
            // recommended가 borderColor·아이콘 색에서 우선, "완료"/"미완" 라벨은 별도 영역에 유지.
            const recommended = cat.key === recommendedKey;
            const borderColor = recommended
              ? colors.purple[400]
              : answered
              ? colors.purple[600]
              : colors.border;
            return (
              <Pressable
                key={cat.key}
                onPress={() => router.push(`/about-me/${cat.key}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${cat.title} - ${answered ? '답변 완료' : '답변 미완'}${recommended ? ' (지금 권장)' : ''}`}
                className="rounded-2xl p-4 active:opacity-70"
                style={{
                  width: '47%',
                  backgroundColor: colors.surface,
                  borderWidth: recommended ? 1.5 : 1,
                  borderColor,
                }}
              >
                <View className="mb-2 flex-row items-center justify-between">
                  <Icon
                    name={cat.icon}
                    size={26}
                    color={recommended || answered ? colors.purple[400] : colors.gray[400]}
                  />
                  {recommended && (
                    <Caption className="text-purple-400 text-xs">지금 권장</Caption>
                  )}
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
