import { useEffect, useState, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { Caption } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { useUserStore } from '@/store/useUserStore';
import { recordUrge, fetchUrgeTrend, fetchTodayUrgeCount } from '@/api/contactUrges';
import { trackEvent } from '@/api/telemetry';

// D-4 자가 보고 연락 카운터 — 홈 하단 1탭 칩 + 7일 추세 sparkline.
//
// 정책:
//  · 1탭 = 1회 보고. cooldown 없음 (의도적 — 충동이 반복되면 그대로 기록)
//  · 추세 시각화는 7일 막대 — 절대값보다 *패턴* 인식 도움
//  · "오늘 ○회" 누적 표시 — 자기 인식 유도. 0회면 비공개 (무판단 톤)
//  · 텔레메트리: contact_urge_reported (옵트인 사용자만)

const BAR_MAX_HEIGHT = 24;

export function ContactUrgeChip() {
  const userId = useUserStore((s) => s.userId);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [trend, setTrend] = useState<Array<{ date: string; count: number }>>([]);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    try {
      const [count, t] = await Promise.all([
        fetchTodayUrgeCount(userId),
        fetchUrgeTrend(userId),
      ]);
      setTodayCount(count);
      setTrend(t);
    } catch {
      // silent — 칩은 보조 UI
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onTap = useCallback(async () => {
    if (!userId || pending) return;
    setPending(true);
    setTodayCount((c) => (c ?? 0) + 1);
    try {
      await recordUrge(userId);
      // 옵트인 사용자만 — payload는 카운트만 (개인 식별 정보 없음)
      trackEvent('contact_urge_reported', {});
      // 추세는 사후 동기화 — 사용자가 인지할 만큼 지연되지 않음
      const t = await fetchUrgeTrend(userId);
      setTrend(t);
    } catch {
      setTodayCount((c) => Math.max(0, (c ?? 1) - 1));
    } finally {
      setPending(false);
    }
  }, [userId, pending]);

  if (!userId) return null;

  const maxCount = Math.max(1, ...trend.map((d) => d.count));

  return (
    <View
      className="rounded-2xl px-4 py-3"
      style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
    >
      <Pressable
        onPress={onTap}
        accessibilityRole="button"
        accessibilityLabel="오늘 연락하고 싶었어"
        accessibilityHint="1번 탭하면 충동 1회로 기록돼. 7일 추세를 함께 볼 수 있어."
        className="flex-row items-center gap-3 active:opacity-70"
      >
        <Icon name="message-circle" size={20} color={colors.purple[400]} />
        <View className="flex-1">
          <Text className="text-gray-200 font-semibold text-sm">오늘 연락하고 싶었어?</Text>
          <Caption className="text-gray-600 text-xs mt-0.5">
            {todayCount && todayCount > 0
              ? `오늘 ${todayCount}번 — 탭하면 1회 더 기록돼`
              : '한 번 누르면 기록만 남아. 판단 없어.'}
          </Caption>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: colors.overlayPurpleSoft }}
        >
          <Text className="text-purple-400 text-xs font-semibold">+1</Text>
        </View>
      </Pressable>

      {trend.length > 0 && (
        <View className="mt-3">
          <View className="flex-row items-end justify-between" style={{ height: BAR_MAX_HEIGHT }}>
            {trend.map((d, i) => {
              const ratio = d.count / maxCount;
              const h = Math.max(2, ratio * BAR_MAX_HEIGHT);
              return (
                <View
                  key={d.date}
                  style={{
                    width: 18,
                    height: h,
                    borderRadius: 3,
                    backgroundColor:
                      d.count === 0 ? colors.overlayGrayMuted : colors.purple[400],
                    opacity: i === trend.length - 1 ? 1 : 0.6,
                  }}
                />
              );
            })}
          </View>
          <View className="flex-row items-center justify-between mt-1.5">
            <Caption className="text-gray-600 text-[10px]">7일 전</Caption>
            <Caption className="text-gray-600 text-[10px]">오늘</Caption>
          </View>
        </View>
      )}
    </View>
  );
}
