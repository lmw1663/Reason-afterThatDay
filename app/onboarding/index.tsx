import { useState } from 'react';
import { Text, View, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useUserStore } from '@/store/useUserStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/api/supabase';
import { formatDateStr, parseDateStr } from '@/utils/dateUtils';

export default function OnboardingDateScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { setBreakupDate } = useUserStore();
  const { signInAnonymously } = useAuth();

  const today = formatDateStr(new Date());

  async function handleNext() {
    if (!selectedDate) {
      Alert.alert('날짜를 선택해줘');
      return;
    }
    setLoading(true);
    try {
      const session = await signInAnonymously();
      const userId = session.user?.id;
      if (!userId) throw new Error('auth failed');

      await supabase.from('users').upsert({
        id: userId,
        breakup_date: selectedDate,
        onboarding_completed: false,
      });

      setBreakupDate(parseDateStr(selectedDate));
      router.push('/onboarding/mood');
    } catch (e) {
      Alert.alert('잠깐, 오류가 생겼어', '다시 시도해줄래?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-16">
        <Text className="text-gray-400 text-sm mb-2">reason</Text>
        <Text className="text-white text-3xl font-bold mb-2">
          언제 헤어졌어?
        </Text>
        <Text className="text-gray-400 text-base mb-8">
          날짜를 알면 네가 걸어온 거리를 함께 볼 수 있어.
        </Text>

        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={
            selectedDate
              ? { [selectedDate]: { selected: true, selectedColor: '#7F77DD' } }
              : {}
          }
          maxDate={today}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: '#5F5E5A',
            selectedDayBackgroundColor: '#7F77DD',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#7F77DD',
            dayTextColor: '#F1EFE8',
            textDisabledColor: '#444441',
            arrowColor: '#7F77DD',
            monthTextColor: '#F1EFE8',
            textMonthFontWeight: '600',
            textDayFontSize: 15,
            textMonthFontSize: 17,
          }}
        />

        {selectedDate ? (
          <View className="mt-6 p-4 rounded-2xl items-center" style={{ backgroundColor: '#1A1A22' }}>
            <Text className="text-gray-400 text-sm">선택한 날짜</Text>
            <Text className="text-white text-lg font-semibold mt-1">{selectedDate}</Text>
          </View>
        ) : null}
      </View>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="다음"
          onPress={handleNext}
          loading={loading}
          disabled={!selectedDate}
        />
      </View>
    </ScreenWrapper>
  );
}
