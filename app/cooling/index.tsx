import { useEffect, useState } from 'react';
import { Text, View, ScrollView, Alert, TextInput } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { CoolingTimer } from '@/components/ui/CoolingTimer';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { InsightCard } from '@/components/ui/InsightCard';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { BackHeader } from '@/components/ui/BackHeader';
import { MoodChart } from '@/components/ui/MoodChart';
import { BreathingGuide } from '@/components/BreathingGuide';
import { Modal } from '@/components/ui/Modal';
import { useCoolingStore } from '@/store/useCoolingStore';
import { useUserStore } from '@/store/useUserStore';
import { useJournalStore } from '@/store/useJournalStore';
import { useRelationshipStore } from '@/store/useRelationshipStore';
import { cancelCooling } from '@/api/graduation';
import {
  saveCoolingReflection,
  fetchEarliestJournalEntry,
  fetchLastEntryBefore,
} from '@/api/coolingReflections';
import { colors } from '@/constants/colors';

function getCoolingDay(requestedAt: string): number {
  const start = new Date(requestedAt);
  const diff = Math.floor((Date.now() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.min(7, diff + 1);
}

export default function CoolingDashboardScreen() {
  const { id, coolingEndsAt, requestedAt, status, checkinResponses, updateStatus } = useCoolingStore();
  const { userId } = useUserStore();
  const { stats } = useJournalStore();
  const { profile } = useRelationshipStore();

  const [breathingVisible, setBreathingVisible] = useState(false);
  const [day2First, setDay2First] = useState<{ moodScore: number; freeText: string | null; createdAt: string } | null>(null);
  const [day2Last, setDay2Last] = useState<{ moodScore: number; freeText: string | null; createdAt: string } | null>(null);
  const [reflectionText, setReflectionText] = useState('');
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const coolingDay = requestedAt ? getCoolingDay(requestedAt) : 1;

  const isDay7 = coolingEndsAt
    ? new Date(coolingEndsAt).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (coolingDay !== 2 || !userId || !requestedAt) return;
    fetchEarliestJournalEntry(userId).then(setDay2First);
    fetchLastEntryBefore(userId, requestedAt).then(setDay2Last);
  }, [coolingDay, userId]);

  async function handleCancel() {
    Alert.alert(
      '졸업 신청 취소',
      '취소하면 유예 기간이 종료돼. 체크인 기록은 보존돼. 계속할게?',
      [
        { text: '아니야', style: 'cancel' },
        {
          text: '취소할게',
          style: 'destructive',
          onPress: async () => {
            if (!id || !userId) return;
            await cancelCooling(id);
            updateStatus('cancelled');
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }

  async function handleSaveReflection() {
    if (!userId || !id || !reflectionText.trim()) return;
    setSaving(true);
    try {
      await saveCoolingReflection({
        userId,
        coolingPeriodId: id,
        day: coolingDay as 5 | 6,
        reflectionType: coolingDay === 5 ? 'learning' : 'future_plan',
        text: reflectionText.trim(),
      });
      setReflectionSaved(true);
    } catch {
      // 실패 시 UX 차단 없이 무시
    } finally {
      setSaving(false);
    }
  }

  if (!coolingEndsAt || status !== 'cooling') {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <ScreenWrapper>
      {/* Day 1 호흡 모달 */}
      <Modal
        visible={breathingVisible}
        onClose={() => setBreathingVisible(false)}
        title="함께 호흡해봐"
      >
        <BreathingGuide pattern="deep" onComplete={() => setBreathingVisible(false)} />
      </Modal>

      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader label="홈" onPress={() => router.replace('/(tabs)')} />
        <Caption className="mb-2">유예 기간 · Day {coolingDay} / 7</Caption>
        <Heading className="mb-6">마음을 다시 들여다봐</Heading>

        {/* D-N 카운트다운 */}
        <View className="bg-surface rounded-2xl mb-6">
          <CoolingTimer coolingEndsAt={coolingEndsAt} />
        </View>

        {/* Day별 회복 콘텐츠 */}
        {coolingDay === 1 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-2">Day 1 — 첫 하루 버티기</Caption>
            <Body className="text-gray-300 mb-4 leading-relaxed">
              지금 너의 마음이 하는 모든 반응이 정상이야.{'\n'}
              혼란도, 안도감도, 후회도 다 이 시점의 자연스러운 감정이야.{'\n'}
              오늘은 아무것도 다시 결정하지 않아도 돼.
            </Body>
            <PrimaryButton
              label="🫁 호흡 함께 하기 (36초)"
              onPress={() => setBreathingVisible(true)}
            />
          </Card>
        )}

        {coolingDay === 2 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-3">Day 2 — 여기까지 온 너</Caption>
            <Body className="text-gray-300 mb-4">너는 어떻게 여기까지 왔을까.</Body>

            {day2First && (
              <Card className="mb-3 border border-gray-700">
                <Caption className="text-gray-500 mb-1">
                  🌱 처음 — {new Date(day2First.createdAt).toLocaleDateString('ko-KR')}
                </Caption>
                <Body className="text-gray-300 text-sm mb-1">
                  {day2First.freeText || '감정만 기록했어'}
                </Body>
                <Caption className="text-gray-500">온도: {day2First.moodScore}/10</Caption>
              </Card>
            )}
            {day2Last && day2Last.createdAt !== day2First?.createdAt && (
              <Card className="mb-3 border border-purple-800">
                <Caption className="text-purple-400 mb-1">
                  🍂 결심 전 — {new Date(day2Last.createdAt).toLocaleDateString('ko-KR')}
                </Caption>
                <Body className="text-gray-300 text-sm mb-1">
                  {day2Last.freeText || '감정만 기록했어'}
                </Body>
                <Caption className="text-gray-500">온도: {day2Last.moodScore}/10</Caption>
              </Card>
            )}
            <Caption className="text-teal-400 mt-2">
              그 사이 너는 이렇게 많이 자랐어.
            </Caption>
          </Card>
        )}

        {coolingDay === 3 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-3">Day 3 — 너의 정당한 감정</Caption>
            <Body className="text-gray-300 mb-3">
              지금 그 사람이 미웠던 부분이 많이 떠오를 수 있어.{'\n'}
              분노는 이별의 매우 정상적인 단계야.
            </Body>
            {profile.cons.length > 0 ? (
              <View className="gap-2 mb-3">
                {profile.cons.slice(0, 5).map((con, i) => (
                  <View key={i} className="flex-row items-start gap-2">
                    <Caption className="text-gray-600">•</Caption>
                    <Caption className="text-gray-400 flex-1">{con}</Caption>
                  </View>
                ))}
              </View>
            ) : (
              <Caption className="text-gray-600 mb-3">
                관계 분석에서 단점을 입력하면 여기서 볼 수 있어.
              </Caption>
            )}
            <Caption className="text-teal-400">
              이 한계들이 있었기에 너의 선택이 정당했어.
            </Caption>
          </Card>
        )}

        {coolingDay === 4 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-3">Day 4 — 너의 감정 변화</Caption>
            {(stats?.moodTrend?.length ?? 0) >= 2 ? (
              <MoodChart moodScores={stats!.moodTrend} label={`Day 1~${coolingDay} 감정 온도`} />
            ) : (
              <Caption className="text-gray-600 py-4 text-center">
                일기 2개 이상 있을 때 차트가 표시돼.
              </Caption>
            )}
            <Body className="text-gray-300 mt-4 leading-relaxed">
              이렇게 내려가는 그래프가 정상이야.{'\n'}
              슬픔이 깊어지는 것은 너가 약해서가 아니라,{'\n'}
              그 관계가 얼마나 소중했는지를 보여줄 뿐이야.
            </Body>
          </Card>
        )}

        {coolingDay === 5 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-3">Day 5 — 의미 찾기</Caption>
            {reflectionSaved ? (
              <>
                <Caption className="text-teal-400 mb-2">저장됐어.</Caption>
                <Body className="text-gray-300">
                  그 배움이 너를 더 단단하게 만들 거야.
                </Body>
              </>
            ) : (
              <>
                <Body className="text-gray-300 mb-4">
                  이 관계에서 너는 무엇을 배웠어?
                </Body>
                <TextInput
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  placeholder="예: 내가 진짜 원하는 게 뭔지 알게 됐어"
                  placeholderTextColor={colors.gray[600]}
                  multiline
                  className="text-white text-sm leading-relaxed mb-4"
                  style={{ minHeight: 80 }}
                />
                <PrimaryButton
                  label="저장할게"
                  onPress={handleSaveReflection}
                  loading={saving}
                  disabled={!reflectionText.trim()}
                />
              </>
            )}
          </Card>
        )}

        {coolingDay === 6 && (
          <Card className="mb-6">
            <Caption className="text-purple-400 mb-3">Day 6 — 미래를 그려보기</Caption>
            {reflectionSaved ? (
              <>
                <Caption className="text-teal-400 mb-2">저장됐어.</Caption>
                <Body className="text-gray-300">
                  너가 이미 미래를 그리기 시작했어.{'\n'}그것만으로도 너는 충분히 회복하고 있는 거야.
                </Body>
              </>
            ) : (
              <>
                <Body className="text-gray-300 mb-4">
                  졸업 후 첫 한 주를 어떻게 보내고 싶어?
                </Body>
                <TextInput
                  value={reflectionText}
                  onChangeText={setReflectionText}
                  placeholder="친구들 만나기, 새로운 취미, 휴식 취하기..."
                  placeholderTextColor={colors.gray[600]}
                  multiline
                  className="text-white text-sm leading-relaxed mb-4"
                  style={{ minHeight: 80 }}
                />
                <PrimaryButton
                  label="저장할게"
                  onPress={handleSaveReflection}
                  loading={saving}
                  disabled={!reflectionText.trim()}
                />
              </>
            )}
          </Card>
        )}

        {/* 안내 */}
        <InsightCard
          tag="유예 기간 중"
          body="일반 알림은 모두 중지돼 있어. 오롯이 마음을 정리하는 시간이야. Day 7에 최종 확인 알림이 올 거야."
          accent="teal"
        />

        <View className="mt-4 mb-6" />

        {/* 체크인 기록 */}
        {(checkinResponses as unknown[]).length > 0 && (
          <View className="mb-6">
            <Caption className="mb-3">체크인 기록</Caption>
            {(checkinResponses as { text: string; date: string }[]).map((r, i) => (
              <Card key={i} className="p-3 mb-2 rounded-xl">
                <Caption variant="subtle" className="mb-1">{r.date}</Caption>
                <Text className="text-white text-sm">{r.text}</Text>
              </Card>
            ))}
          </View>
        )}

        {isDay7 && (
          <Card variant="subtle" accent="teal" className="mb-4">
            <Text className="text-teal-400 text-sm text-center font-semibold">
              오늘이 Day 7이야. 최종 확인을 할 수 있어.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View className="px-6 pb-10 gap-3">
        <PrimaryButton label="자율 체크인 하기" onPress={() => router.push('/cooling/checkin')} />
        {isDay7 && (
          <PrimaryButton leftIcon="graduation" label="최종 졸업 확인" onPress={() => router.push('/cooling/final')} />
        )}
        <PrimaryButton label="취소할게" variant="ghost" onPress={handleCancel} />
      </View>
    </ScreenWrapper>
  );
}
