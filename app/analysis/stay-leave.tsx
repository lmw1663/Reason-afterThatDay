import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { useRelationshipStore } from '@/store/useRelationshipStore';

interface SliderItem {
  field: 'fix' | 'other' | 'role';
  label: string;
  desc: string;
  color: string;
}

const ITEMS: SliderItem[] = [
  { field: 'fix',   label: '극복 가능성',  desc: '둘 사이의 문제가 해결될 수 있을 것 같아?',  color: colors.purple[400] },
  { field: 'other', label: '상대방 마음',  desc: '상대방도 아직 마음이 남아있을 것 같아?',      color: colors.pink[400] },
  { field: 'role',  label: '내 역할',     desc: '이 관계에서 내가 더 잘할 수 있었을 것 같아?',  color: colors.teal[400] },
];

export default function AnalysisStayLeave() {
  const { profile, updateField } = useRelationshipStore();
  const [values, setValues] = useState<Record<string, number>>({
    fix: profile.fix,
    other: profile.other,
    role: profile.role,
  });

  function handleNext() {
    updateField('fix',   values.fix   as 0);
    updateField('other', values.other as 0);
    updateField('role',  values.role  as 0);
    router.push('/analysis/result');
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <BackHeader />
        <Caption className="mb-2">관계 분석 · 3 / 4</Caption>
        <Heading className="mb-2">솔직하게 점수를 매겨봐</Heading>
        <Body className="text-gray-400 mb-8">
          0점(전혀 아니야)부터 10점(완전 그래)까지
        </Body>

        {ITEMS.map(({ field, label, desc, color }) => (
          <View key={field} className="mb-8">
            <Text className="text-white font-semibold text-base mb-1">{label}</Text>
            <Caption className="mb-4">{desc}</Caption>

            <View
              className="flex-row justify-between"
              accessibilityRole="adjustable"
              accessibilityLabel={`${label}, ${desc}`}
              accessibilityValue={{ min: 0, max: 10, now: values[field] }}
            >
              {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setValues((prev) => ({ ...prev, [field]: v }))}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} ${v}점`}
                  accessibilityState={{ selected: values[field] === v }}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: values[field] >= v && v > 0 ? color : colors.border,
                    opacity: v === 0 ? 0.4 : 1,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: values[field] >= v && v > 0 ? colors.white : colors.gray[600] }}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row justify-between mt-1">
              <Caption variant="subtle">전혀 아니야</Caption>
              <Caption variant="subtle">완전 그래</Caption>
            </View>
          </View>
        ))}
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={2} />
        <PrimaryButton label="결과 보기" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}

