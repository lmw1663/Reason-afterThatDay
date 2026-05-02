import { useState } from 'react';
import { colors } from '@/constants/colors';
import { Text, View, Alert } from 'react-native';
import { router } from 'expo-router';
import { Calendar } from 'react-native-calendars';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { useUserStore } from '@/store/useUserStore';
import { supabase } from '@/api/supabase';
import { formatDateStr, parseDateStr } from '@/utils/dateUtils';

export default function OnboardingDateScreen() {
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { setBreakupDate } = useUserStore();

  const today = formatDateStr(new Date());

  async function handleNext() {
    if (!selectedDate) {
      Alert.alert('날짜를 선택해줘');
      return;
    }
    setLoading(true);
    const breakupDate = parseDateStr(selectedDate);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      if (userId) {
        const { error } = await supabase.from('users').upsert({
          id: userId,
          breakup_date: selectedDate,
          onboarding_completed: false,
        });
        if (error) throw error;
      }

      setBreakupDate(breakupDate);
      router.push('/onboarding/duration' as never);
    } catch (e) {
      console.warn('onboarding date save failed:', e);
      setBreakupDate(breakupDate);
      router.push('/onboarding/duration' as never);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenWrapper>
      <View className="flex-1 px-6 pt-16">
        <Caption className="mb-2">reason</Caption>
        <Display className="mb-2">언제 헤어졌어?</Display>
        <Body className="text-gray-400 mb-8">
          날짜를 알면 네가 걸어온 거리를 함께 볼 수 있어.
        </Body>

        <Calendar
          onDayPress={(day) => setSelectedDate(day.dateString)}
          markedDates={
            selectedDate
              ? { [selectedDate]: { selected: true, selectedColor: colors.purple[400] } }
              : {}
          }
          maxDate={today}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textSectionTitleColor: colors.gray[600],
            selectedDayBackgroundColor: colors.purple[400],
            selectedDayTextColor: colors.white,
            todayTextColor: colors.purple[400],
            dayTextColor: colors.gray[50],
            textDisabledColor: colors.gray[800],
            arrowColor: colors.purple[400],
            monthTextColor: colors.gray[50],
            textMonthFontWeight: '600',
            textDayFontSize: 15,
            textMonthFontSize: 17,
          }}
        />

        {selectedDate ? (
          <Card className="mt-6 items-center">
            <Caption>선택한 날짜</Caption>
            <Text className="text-white text-lg font-semibold mt-1">{selectedDate}</Text>
          </Card>
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
