import { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { BackHeader } from '@/components/ui/BackHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Card } from '@/components/ui/Card';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { formatDateStr } from '@/utils/dateUtils';

// G-7c-2: P08 권태형 사용자를 위한 *부정 없는 봉인* 의식 (매트릭스 §2 C7 line 158).
// 분노·배신감 라벨을 강요하지 않고 함께한 시간을 *그대로 보관*하는 트랙.
// 화면 텍스트엔 페르소나 코드/명칭 노출 금지 — 의식 의도만 전달.
//
// 저장: AsyncStorage(memory_seal_v1) — 베타 진입 후 정식 마이그레이션 예정.
// 한 번 봉인된 기록은 *추가만* 가능, 화면 내 삭제·수정 X — "태우지 않는다" 정신.

const STORAGE_KEY = 'memory_seal_v1';

interface SealedEntry {
  id: string;
  content: string;
  sealedAt: number;
}

export default function MemorySealScreen() {
  const [entries, setEntries] = useState<SealedEntry[]>([]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as SealedEntry[];
        setEntries(parsed.sort((a, b) => b.sealedAt - a.sealedAt));
      } catch {
        // 손상된 데이터는 무시 — 새로 시작 가능
      }
    });
  }, []);

  async function handleSeal() {
    const trimmed = content.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const entry: SealedEntry = {
      id: `seal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: trimmed,
      sealedAt: Date.now(),
    };
    const next = [entry, ...entries];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setEntries(next);
      setContent('');
      Animated.sequence([
        Animated.timing(toast, { toValue: 1, duration: 280, useNativeDriver: true }),
        Animated.delay(1400),
        Animated.timing(toast, { toValue: 0, duration: 320, useNativeDriver: true }),
      ]).start();
    } catch {
      // 저장 실패는 fail open — 사용자 입력 보존
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenWrapper keyboardAvoiding>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackHeader />

        <Heading className="mb-2">있던 시간 그대로 두기</Heading>
        <Body className="text-gray-400 mb-3">
          지금 굳이 정리하거나 부정하지 않아도 돼.
        </Body>
        <Caption className="text-gray-500 mb-6 leading-5">
          그 시간이 너에게 어떤 의미였는지 한 줄씩 적어두자.{'\n'}
          지금은 이 기기에 보관돼. 언제든 다시 열어볼 수 있어.
        </Caption>

        <Card className="mb-4">
          <Caption className="text-gray-500 mb-3">새로 보관하기</Caption>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="그 시간에서 너에게 의미 있던 한 가지..."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={400}
            textAlignVertical="top"
            accessibilityLabel="보관할 기억 입력"
            className="text-white text-base px-4 py-3 rounded-xl"
            style={{
              backgroundColor: colors.bg,
              borderWidth: 1,
              borderColor: colors.border,
              minHeight: 100,
            }}
          />
          <View className="flex-row justify-between items-center mt-1 mb-3">
            <Caption className="text-gray-600 text-xs">{content.length} / 400</Caption>
          </View>
          <PrimaryButton
            label={saving ? '보관 중...' : '여기에 보관하기'}
            leftIcon="archive"
            onPress={handleSeal}
            loading={saving}
            disabled={!content.trim()}
          />
        </Card>

        {entries.length === 0 ? (
          <Card variant="subtle" accent="purple" tone="weak" className="mt-2">
            <Caption className="text-gray-500 text-center">
              아직 보관된 기억이 없어. 첫 한 줄을 적어볼래?
            </Caption>
          </Card>
        ) : (
          <View>
            <Caption className="text-gray-500 mb-3">보관된 기억 {entries.length}개</Caption>
            <View className="gap-3">
              {entries.map((e) => (
                <View
                  key={e.id}
                  className="rounded-2xl p-4"
                  style={{
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Caption className="text-gray-600 mb-2">
                    {formatDateStr(new Date(e.sealedAt))}
                  </Caption>
                  <Body className="text-gray-200 leading-relaxed">{e.content}</Body>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 24,
          right: 24,
          bottom: 32,
          opacity: toast,
          transform: [
            { translateY: toast.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
          ],
        }}
      >
        <Card variant="accent" className="flex-row items-center gap-2 justify-center">
          <Icon name="check" size={16} color={colors.purple[400]} />
          <Body className="text-purple-400">여기 그대로 보관됐어</Body>
        </Card>
      </Animated.View>
    </ScreenWrapper>
  );
}
