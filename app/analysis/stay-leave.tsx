import { useState } from 'react';
import { Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useRelationshipStore } from '@/store/useRelationshipStore';

interface SliderItem {
  field: 'fix' | 'other' | 'role';
  label: string;
  desc: string;
  color: string;
}

const ITEMS: SliderItem[] = [
  { field: 'fix',   label: '극복 가능성',  desc: '둘 사이의 문제가 해결될 수 있을 것 같아?',  color: '#7F77DD' },
  { field: 'other', label: '상대방 마음',  desc: '상대방도 아직 마음이 남아있을 것 같아?',      color: '#D4537E' },
  { field: 'role',  label: '내 역할',     desc: '이 관계에서 내가 더 잘할 수 있었을 것 같아?',  color: '#1D9E75' },
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
        <Text className="text-gray-400 text-sm mb-2">관계 분석 · 3 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-2">
          솔직하게 점수를 매겨봐
        </Text>
        <Text className="text-gray-400 text-sm mb-8">
          0점(전혀 아니야)부터 10점(완전 그래)까지
        </Text>

        {ITEMS.map(({ field, label, desc, color }) => (
          <View key={field} className="mb-8">
            <Text className="text-white font-semibold text-base mb-1">{label}</Text>
            <Text className="text-gray-400 text-sm mb-4">{desc}</Text>

            <View className="flex-row justify-between">
              {Array.from({ length: 11 }, (_, i) => i).map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setValues((prev) => ({ ...prev, [field]: v }))}
                  className="w-7 h-7 rounded-full items-center justify-center"
                  style={{
                    backgroundColor: values[field] >= v && v > 0 ? color : '#2C2C38',
                    opacity: v === 0 ? 0.4 : 1,
                  }}
                >
                  <Text
                    className="text-xs font-bold"
                    style={{ color: values[field] >= v && v > 0 ? '#fff' : '#5F5E5A' }}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View className="flex-row justify-between mt-1">
              <Text className="text-gray-600 text-xs">전혀 아니야</Text>
              <Text className="text-gray-600 text-xs">완전 그래</Text>
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

