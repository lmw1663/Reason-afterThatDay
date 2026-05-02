import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRecentEntries } from '@/api/journal';

const SILENCE_KEY = 'emotional_safety_last_trigger';
const SILENCE_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

async function isInSilenceWindow(): Promise<boolean> {
  const lastTriggeredAt = await AsyncStorage.getItem(SILENCE_KEY);
  if (!lastTriggeredAt) return false;
  return Date.now() - Number(lastTriggeredAt) < SILENCE_DURATION_MS;
}

async function recordTrigger(): Promise<void> {
  await AsyncStorage.setItem(SILENCE_KEY, String(Date.now()));
}

export interface SafetyCheckResult {
  triggered: boolean;
  type?: 'consecutive_low_mood_score' | 'late_night_access';
}

export function useEmotionalSafety() {
  const checkConsecutiveLowTemperature = async (
    userId: string,
  ): Promise<SafetyCheckResult> => {
    if (await isInSilenceWindow()) return { triggered: false };

    const last3 = await fetchRecentEntries(userId, 3);
    const allCritical = last3.length === 3 && last3.every((e) => e.moodScore <= 2);

    if (allCritical) {
      await recordTrigger();
      return { triggered: true, type: 'consecutive_low_mood_score' };
    }
    return { triggered: false };
  };

  const checkLateNightAccess = async (): Promise<SafetyCheckResult> => {
    if (await isInSilenceWindow()) return { triggered: false };

    const hour = new Date().getHours();
    if (hour < 4) {
      await recordTrigger();
      return { triggered: true, type: 'late_night_access' };
    }
    return { triggered: false };
  };

  return { checkConsecutiveLowTemperature, checkLateNightAccess };
}
