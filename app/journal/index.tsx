import { useState } from 'react';
import { Text, View, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { MoodSlider } from '@/components/ui/MoodSlider';
import { Pill } from '@/components/ui/Pill';
import { ProgressDots } from '@/components/ui/ProgressDots';
import { useJournalStore } from '@/store/useJournalStore';

const MOOD_TAGS = ['슬퍼', '화나', '허전해', '후련해', '그리워', '무감각해', '지쳐', '외로워'];

export default function JournalMoodScreen() {
  const [score, setScore] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  function toggleTag(t: string) {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function handleNext() {
    router.push({
      pathname: '/journal/direction',
      params: { score: String(score), tags: tags.join(','), freeText },
    });
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-14">
        <Text className="text-gray-400 text-sm mb-2">이별 일기 · 1 / 4</Text>
        <Text className="text-white text-2xl font-bold mb-8">
          지금 감정 온도가 몇 도야?
        </Text>

        <MoodSlider value={score} onChange={setScore} />

        <View className="flex-row flex-wrap mt-8 mb-4">
          {MOOD_TAGS.map((t) => (
            <Pill key={t} label={t} selected={tags.includes(t)} onPress={() => toggleTag(t)} />
          ))}
        </View>

        <TextInput
          value={freeText}
          onChangeText={setFreeText}
          placeholder="더 하고 싶은 말이 있으면 써봐 (선택)"
          placeholderTextColor="#5F5E5A"
          multiline
          className="text-white text-base leading-relaxed"
          style={{ minHeight: 80 }}
        />
      </View>

      <View className="px-6 pb-10 gap-4">
        <ProgressDots total={4} current={0} />
        <PrimaryButton label="다음" onPress={handleNext} />
      </View>
    </ScreenWrapper>
  );
}
