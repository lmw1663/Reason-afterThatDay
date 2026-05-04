import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, type Href } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Body, Caption } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { getLastAssessmentDate } from '@/api/assessments';
import {
  pickRecommendation,
  type AssessmentRecommendation,
} from '@/utils/assessmentTrigger';

// D-3 진입 시 측정 권유 카드 — 홈 화면 노출.
//
// 정책:
//  · pickRecommendation이 결정한 1건만 노출 (다중 동시 윈도우는 PHQ9 우선)
//  · 닫기 → AsyncStorage에 instrument+date로 24h 노출 차단 (피로도 방지)
//  · userId·breakupDate 부재 시 null 반환 (홈 wrapper도 렌더 X)
//  · 졸업 보류 중에도 노출 — 결정 강제 X, 자기 점검 도구

const DISMISS_KEY = 'assessment_rec_dismissed_v1';

interface DismissRecord { instrument: string; dismissedAt: string }

export function AssessmentRecommendationCard() {
  const { userId, daysElapsed, breakupDate } = useUserStore();
  const [rec, setRec] = useState<AssessmentRecommendation | null>(null);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      getLastAssessmentDate(userId, 'PHQ9'),
      getLastAssessmentDate(userId, 'GAD7'),
      getLastAssessmentDate(userId, 'RSE'),
    ])
      .then(async ([phq9, gad7, rse]) => {
        const candidate = pickRecommendation(
          daysElapsed,
          breakupDate ? new Date(breakupDate).toISOString() : null,
          { PHQ9: phq9, GAD7: gad7, RSE: rse },
        );
        if (!candidate) return;
        const dismissed = await readDismiss();
        if (
          dismissed?.instrument === candidate.instrument &&
          isWithin24h(dismissed.dismissedAt)
        ) {
          return;
        }
        setRec(candidate);
      })
      .catch(() => {/* silent — 권유 카드 실패는 흐름 비차단 */});
  }, [userId, daysElapsed, breakupDate]);

  if (!rec) return null;

  function open() {
    router.push(`/assessments/${rec!.instrument}?source=${rec!.source}` as Href);
  }

  async function dismiss() {
    const record: DismissRecord = {
      instrument: rec!.instrument,
      dismissedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem(DISMISS_KEY, JSON.stringify(record)).catch(() => {});
    setRec(null);
  }

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={rec.cardTitle}
      accessibilityHint={rec.cardSubtitle}
      className="rounded-2xl px-4 py-4 active:opacity-80 flex-row items-start gap-3"
      style={{
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.purple[800],
      }}
    >
      <View
        className="rounded-full p-2"
        style={{ backgroundColor: colors.overlayPurpleSoft }}
      >
        <Icon name="leaf" size={18} color={colors.purple[400]} />
      </View>
      <View className="flex-1">
        <Body className="text-purple-400 font-semibold text-sm">{rec.cardTitle}</Body>
        <Caption className="text-gray-500 text-xs mt-0.5">{rec.cardSubtitle}</Caption>
      </View>
      <View className="flex-row items-center gap-1">
        <Pressable
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="이번엔 안 할게"
          hitSlop={8}
          className="active:opacity-60 px-2 py-1"
        >
          <Caption className="text-gray-600 text-xs">나중에</Caption>
        </Pressable>
        <Icon name="chevron-right" size={16} color={colors.gray[400]} />
      </View>
    </Pressable>
  );
}

async function readDismiss(): Promise<DismissRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DismissRecord;
  } catch {
    return null;
  }
}

function isWithin24h(iso: string): boolean {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < 24 * 3600 * 1000;
}
