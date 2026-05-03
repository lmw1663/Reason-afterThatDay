import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// expo-file-system v19+는 main entry가 신규 File/Directory 객체 API.
// legacy 서브경로는 v20+에서 제거 가능 — TODO: 신규 API로 마이그레이션.
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { colors } from '@/constants/colors';
import { supabase } from '@/api/supabase';
import { isAppLocked } from '@/api/safety';
import { useUserStore } from '@/store/useUserStore';
import {
  getDataSummary,
  exportUserData,
  deleteAllUserData,
  type DataSummaryItem,
} from '@/api/userData';
import {
  getProcessingSuspension,
  updateProcessingSuspension,
  type ProcessingSuspension,
} from '@/api/processingSuspension';

// X-1 PIPA 컴플라이언스 — 사용자가 자기 데이터를 *직접* 보고·내보내고·삭제할 수 있는 트랙.
// 개인정보 보호법 제35조(열람) · 제36조(삭제) · GDPR Art.20(반출) 대응.
//
// 삭제는 *2단계 확인 + 별도 alert* + AsyncStorage 정리 + auth signOut. 계정 자체 삭제는
// admin 트랙으로 위임 (별도 안내).

export default function DataSettingsScreen() {
  const { userId } = useUserStore();
  const [summary, setSummary] = useState<DataSummaryItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // B-1 안전 잠금 — C-SSRS 양성 시 충동 삭제 차단 (opus 권고 1)
  const [decisionLocked, setDecisionLocked] = useState(false);
  // X-1-잔여 §37 처리정지권 — 알림·AI 분석 정지 토글
  const [suspension, setSuspension] = useState<ProcessingSuspension | null>(null);
  const [togglingNotif, setTogglingNotif] = useState(false);
  const [togglingAi, setTogglingAi] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getDataSummary(userId)
      .then(setSummary)
      .catch(() => setError('데이터 요약을 불러오지 못했어'))
      .finally(() => setLoading(false));
    isAppLocked(userId)
      .then((s) => setDecisionLocked(s.decisionLocked))
      .catch(() => {/* fail open — 잠금 조회 실패 시 보수적으로 unlocked */});
    getProcessingSuspension(userId)
      .then(setSuspension)
      .catch(() => {/* fail open — 토글 미표시 (모두 활성으로 간주) */});
  }, [userId]);

  async function toggleNotificationSuspension() {
    if (!userId || !suspension || togglingNotif) return;
    setTogglingNotif(true);
    setError(null);
    const next = !suspension.notificationsSuspended;
    try {
      await updateProcessingSuspension(userId, { notificationsSuspended: next });
      setSuspension({ ...suspension, notificationsSuspended: next, updatedAt: new Date().toISOString() });
    } catch {
      setError('알림 설정 변경이 실패했어. 잠시 후 다시 시도해줘.');
    } finally {
      setTogglingNotif(false);
    }
  }

  async function toggleAiSuspension() {
    if (!userId || !suspension || togglingAi) return;
    setTogglingAi(true);
    setError(null);
    const next = !suspension.aiAnalysisSuspended;
    try {
      await updateProcessingSuspension(userId, { aiAnalysisSuspended: next });
      setSuspension({ ...suspension, aiAnalysisSuspended: next, updatedAt: new Date().toISOString() });
    } catch {
      setError('AI 분석 설정 변경이 실패했어. 잠시 후 다시 시도해줘.');
    } finally {
      setTogglingAi(false);
    }
  }

  function confirmExport() {
    if (!userId || exporting) return;
    // opus 권고 2: 민감 정보(C-SSRS·자해 사고 기록 등) 평문 반출 사전 경고
    Alert.alert(
      '내보내기 전 확인',
      '내보내는 데이터에는 위기 평가 응답·안전 잠금 이력 같은 *민감 정보*가 포함될 수 있어.\n평문 JSON으로 외부 앱(메일·메신저 등)에 전달돼. 계속할까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '계속', onPress: () => handleExport() },
      ],
    );
  }

  async function handleExport() {
    if (!userId || exporting) return;
    setExporting(true);
    setError(null);
    try {
      const payload = await exportUserData(userId);
      const json = JSON.stringify(payload, null, 2);

      // X-1-잔여: 대용량 안정성 — *파일 첨부* 모드로 share. iOS Share Sheet의 message 잘림
      // 한계 우회. expo-sharing 미지원 환경(웹 등)은 기존 Share.share message 모드로 fallback.
      // 민감 정보(C-SSRS·자해 사고 등)가 평문 캐시에 잔존하지 않도록 share 직후 즉시 삭제 (PIPA §29).
      const fileName = `reason-data-${new Date().toISOString().slice(0, 10)}.json`;
      const cacheDir = FileSystem.cacheDirectory;
      if (cacheDir && (await Sharing.isAvailableAsync())) {
        const fileUri = cacheDir + fileName;
        try {
          await FileSystem.writeAsStringAsync(fileUri, json, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'reason 데이터 반출',
            UTI: 'public.json',
          });
        } finally {
          // 캐시 잔존 차단 — 사용자가 share를 취소했더라도 즉시 삭제
          await FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {/* ignore */});
        }
      } else {
        await Share.share({ message: json, title: 'reason 데이터 반출' });
      }
    } catch {
      setError('내보내기가 실패했어. 잠시 후 다시 시도해줘.');
    } finally {
      setExporting(false);
    }
  }

  function confirmDelete() {
    if (!userId || deleting) return;
    Alert.alert(
      '정말 모든 데이터를 지울까?',
      '일기·응답·추억·about-me 답변 등 너의 모든 기록이 영구 삭제돼. 되돌릴 수 없어.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '한 번 더 확인',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              '마지막 확인',
              '지금 삭제하면 너의 모든 기록이 사라져. 확실해?',
              [
                { text: '취소', style: 'cancel' },
                { text: '삭제 진행', style: 'destructive', onPress: () => doDelete() },
              ],
            );
          },
        },
      ],
    );
  }

  async function doDelete() {
    if (!userId) return;
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteAllUserData(userId);
      // AsyncStorage 로컬 데이터(memory_seal_v1·declutter·continuing-bonds·encounter-plan
      // · shame-guilt-seen 등)도 함께 정리
      await AsyncStorage.clear().catch(() => {/* fail open */});
      await supabase.auth.signOut().catch(() => {/* ignore */});

      Alert.alert(
        '삭제 완료',
        `${result.deletedTables.length}개 항목에서 너의 기록을 모두 지웠어.${
          result.failedTables.length > 0
            ? `\n실패한 항목 ${result.failedTables.length}개는 운영팀 후속 처리.`
            : ''
        }\n로그아웃됐어.`,
        [{ text: '확인', onPress: () => router.replace('/' as never) }],
      );
    } catch {
      setError('삭제 중 오류가 발생했어. 잠시 후 다시 시도해줘.');
    } finally {
      setDeleting(false);
    }
  }

  const totalRows = summary?.reduce((acc, s) => acc + s.count, 0) ?? 0;
  const hasData = totalRows > 0;

  return (
    <ScreenWrapper>
      <ErrorToast visible={!!error} message={error ?? ''} onHide={() => setError(null)} />
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />

        <Heading className="mb-2">내 데이터 관리</Heading>
        <Body className="text-gray-400 mb-3">
          개인정보 보호법에 따라 너의 모든 기록을 직접 보고·내보내고·지울 수 있어.
        </Body>
        <Caption className="text-gray-500 mb-6 leading-5">
          *내보내기*는 JSON 형식으로 너의 데이터를 다른 앱이나 메일로 보내.{'\n'}
          *삭제*는 되돌릴 수 없어.
        </Caption>

        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Body className="font-medium">보관된 기록</Body>
            <Body className="text-purple-400 font-semibold">{totalRows}</Body>
          </View>
          {loading ? (
            <Caption className="text-gray-500">불러오는 중...</Caption>
          ) : summary && summary.length > 0 ? (
            summary
              .filter((item) => item.count > 0)
              .map((item) => (
                <View
                  key={item.tableName}
                  className="flex-row justify-between py-1.5 border-t"
                  style={{ borderColor: colors.border }}
                >
                  <Caption className="text-gray-400">{item.label}</Caption>
                  <Caption className="text-gray-300 font-medium">{item.count}</Caption>
                </View>
              ))
          ) : (
            <Caption className="text-gray-500">아직 보관된 기록이 없어.</Caption>
          )}
        </Card>

        <View className="mb-6">
          <PrimaryButton
            label={exporting ? '내보내는 중...' : '데이터 내보내기 (JSON)'}
            leftIcon="archive"
            onPress={confirmExport}
            loading={exporting}
            disabled={!userId || !hasData}
          />
        </View>

        {suspension && (
          <View className="mb-6">
            <Caption className="text-gray-500 mb-2">처리 정지</Caption>
            <Card>
              <SuspensionRow
                label="알림 받지 않기"
                description="리마인더·감정 변화·체크인 등 일반 알림 정지. 위기 안부 푸시는 안전상 제외."
                value={suspension.notificationsSuspended}
                loading={togglingNotif}
                onToggle={toggleNotificationSuspension}
              />
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
              <SuspensionRow
                label="AI 분석·응답 멈추기"
                description="GPT 응답 생성·페르소나 자동 분류·감정 분석 정지. 안전 평가는 별도 정책."
                value={suspension.aiAnalysisSuspended}
                loading={togglingAi}
                onToggle={toggleAiSuspension}
              />
            </Card>
            <Caption className="text-gray-600 mt-2 leading-5">
              일기 응답·위로·체크인 등 모든 AI 응답과 일반 알림에 적용돼. 위기 평가는 안전상 별도 정책.
            </Caption>
          </View>
        )}

        <Caption className="text-gray-500 mb-2 mt-2">위험 구간</Caption>
        <Card variant="warning">
          <View className="flex-row items-start gap-3 mb-4">
            <Icon name="x" size={18} color={colors.coral[400]} />
            <View className="flex-1">
              <Body className="font-medium mb-1">모든 데이터 삭제</Body>
              <Caption className="text-gray-400 leading-5">
                일기·응답·추억·about-me 답변 등 모든 기록이 영구 삭제돼.{'\n'}
                계정 자체 삭제는 운영팀 후속 처리가 필요해 (별도 안내).
              </Caption>
              {decisionLocked && (
                <Caption className="text-purple-400 mt-2 leading-5">
                  지금은 안전 확인 중이야. 잠금이 풀리면 삭제할 수 있어.
                </Caption>
              )}
            </View>
          </View>
          <PrimaryButton
            label={deleting ? '삭제 중...' : '모든 데이터 삭제'}
            variant="ghost"
            onPress={confirmDelete}
            loading={deleting}
            disabled={!userId || decisionLocked}
          />
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

interface SuspensionRowProps {
  label: string;
  description: string;
  value: boolean;
  loading: boolean;
  onToggle: () => void;
}

function SuspensionRow({ label, description, value, loading, onToggle }: SuspensionRowProps) {
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: loading }}
      disabled={loading}
      className="flex-row items-start gap-3 active:opacity-70"
      style={{ opacity: loading ? 0.5 : 1 }}
    >
      <View className="flex-1">
        <Body className="font-medium mb-1">{label}</Body>
        <Caption className="text-gray-500 leading-5">{description}</Caption>
      </View>
      <View
        className="px-3 py-1 rounded-full"
        style={{
          borderWidth: 1,
          borderColor: value ? colors.purple[400] : colors.border,
          backgroundColor: value ? colors.overlayPurpleSoft : 'transparent',
        }}
      >
        <Caption
          style={{
            color: value ? colors.purple[400] : colors.gray[400],
            fontWeight: '600',
          }}
        >
          {value ? '정지됨' : '활성'}
        </Caption>
      </View>
    </Pressable>
  );
}
