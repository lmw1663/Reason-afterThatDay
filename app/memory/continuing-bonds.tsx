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

// G-7c-4: P17 강제 이별 사용자를 위한 *Continuing Bonds* 회상 (매트릭스 §2 C7 line 300).
// 본인 결정이 아닌 이별의 *관계 가치 자체*는 분리해 보존. catch/let_go 이분법 무의미.
// 화면 텍스트엔 페르소나 코드/명칭 노출 금지.

const STORAGE_KEY = 'memory_continuing_bonds_v1';

interface BondEntry {
  id: string;
  content: string;
  createdAt: number;
}

export default function MemoryContinuingBondsScreen() {
  const [entries, setEntries] = useState<BondEntry[]>([]);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v) as BondEntry[];
        setEntries(parsed.sort((a, b) => b.createdAt - a.createdAt));
      } catch {
        // 손상된 데이터는 무시
      }
    });
  }, []);

  async function handleAdd() {
    const trimmed = content.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    const entry: BondEntry = {
      id: `cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      content: trimmed,
      createdAt: Date.now(),
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
      // 저장 실패는 fail open
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

        <Heading className="mb-2">관계의 의미 정리</Heading>
        <Body className="text-gray-400 mb-3">
          이별 자체는 네가 정한 게 아니었어. 그건 그대로 두자.
        </Body>
        <Caption className="text-gray-500 mb-6 leading-5">
          왜 헤어졌는지와는 별개로, 이 관계 안에서 너에게 남은 것이 있어.{'\n'}
          한 줄씩 적어두면 사라지지 않고 너의 일부로 남아.
        </Caption>

        <Card className="mb-4">
          <Caption className="text-gray-500 mb-3">남은 것 적기</Caption>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="예: 이 사람과 같이 배운 것 / 알게 된 나의 부분 / 함께한 시간 안의 작은 순간..."
            placeholderTextColor={colors.gray[600]}
            multiline
            maxLength={400}
            textAlignVertical="top"
            accessibilityLabel="관계의 의미 입력"
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
            label={saving ? '추가 중...' : '여기에 남기기'}
            leftIcon="heart-handshake"
            onPress={handleAdd}
            loading={saving}
            disabled={!content.trim()}
          />
        </Card>

        {entries.length === 0 ? (
          <Card variant="subtle" accent="purple" tone="weak" className="mt-2">
            <Caption className="text-gray-500 text-center">
              아직 적은 게 없어. 작은 한 가지부터 적어볼래?
            </Caption>
          </Card>
        ) : (
          <View>
            <Caption className="text-gray-500 mb-3">남긴 것 {entries.length}개</Caption>
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
                    {formatDateStr(new Date(e.createdAt))}
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
          <Body className="text-purple-400">여기 남겨뒀어</Body>
        </Card>
      </Animated.View>
    </ScreenWrapper>
  );
}
