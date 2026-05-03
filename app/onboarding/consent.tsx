import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Body, Caption, Display } from '@/components/ui/Typography';
import { Icon } from '@/components/ui/Icon';
import { colors } from '@/constants/colors';
import { CONSENT_ITEMS, type ConsentKey } from '@/constants/consent';
import { acceptAllConsents } from '@/api/consent';
import { useUserStore } from '@/store/useUserStore';

export default function ConsentScreen() {
  const { userId, setConsent } = useUserStore();
  const [checked, setChecked] = useState<Record<ConsentKey, boolean>>(
    () => CONSENT_ITEMS.reduce((acc, i) => ({ ...acc, [i.key]: false }), {} as Record<ConsentKey, boolean>),
  );
  const [submitting, setSubmitting] = useState(false);

  const allChecked = useMemo(
    () => CONSENT_ITEMS.every(i => checked[i.key]),
    [checked],
  );

  function toggle(key: ConsentKey) {
    setChecked(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function toggleAll() {
    const next = !allChecked;
    setChecked(
      CONSENT_ITEMS.reduce((acc, i) => ({ ...acc, [i.key]: next }), {} as Record<ConsentKey, boolean>),
    );
  }

  async function handleAccept() {
    if (!allChecked) {
      Alert.alert('필수 항목에 모두 동의해야 시작할 수 있어');
      return;
    }
    if (!userId) {
      Alert.alert('잠시 후 다시 시도해줘', '계정 준비 중이야');
      return;
    }
    setSubmitting(true);
    try {
      const { versions, acceptedAt } = await acceptAllConsents(userId);
      setConsent(versions, new Date(acceptedAt));
      router.replace('/onboarding/login' as never);
    } catch (e) {
      console.warn('[consent] save failed:', e);
      Alert.alert('저장에 실패했어', '잠시 후 다시 시도해줘');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReject() {
    Alert.alert(
      '동의 없이는 사용할 수 없어',
      '본 앱은 모든 항목에 동의해야 사용할 수 있어. 천천히 다시 살펴봐.',
      [{ text: '알겠어' }],
    );
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 64, paddingBottom: 24 }}
      >
        <Caption className="mb-2">reason</Caption>
        <Display className="mb-2">시작하기 전에</Display>
        <Body className="text-gray-400 mb-8">
          네 이야기를 안전하게 다루기 위한 약관과 처리방침을 먼저 보여줄게.
          모두 *필수* 항목이야.
        </Body>

        {/* 모두 동의 */}
        <Pressable
          onPress={toggleAll}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: allChecked }}
          className="flex-row items-center rounded-2xl px-4 py-4 mb-3 active:opacity-80"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: allChecked ? colors.purple[400] : colors.border }}
        >
          <CheckBox checked={allChecked} />
          <Body className="ml-3 font-semibold flex-1">전체 동의</Body>
        </Pressable>

        <View className="h-px my-2" style={{ backgroundColor: colors.border }} />

        {/* 항목별 */}
        {CONSENT_ITEMS.map(item => (
          <View key={item.key} className="flex-row items-start py-3">
            <Pressable
              onPress={() => toggle(item.key)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: checked[item.key] }}
              className="active:opacity-70 pt-0.5"
              hitSlop={8}
            >
              <CheckBox checked={checked[item.key]} />
            </Pressable>

            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Caption className="text-purple-400 font-semibold mr-1.5">[필수]</Caption>
                <Body className="font-medium flex-1">{item.title}</Body>
              </View>
              <Caption className="text-gray-500 mt-0.5">{item.summary}</Caption>
            </View>

            {item.documentSlug ? (
              <Pressable
                onPress={() => router.push(`/legal/${item.documentSlug}` as never)}
                accessibilityRole="button"
                accessibilityLabel={`${item.title} 본문 보기`}
                hitSlop={8}
                className="pt-0.5 active:opacity-60"
              >
                <Icon name="chevron-right" size={20} color={colors.gray[400]} />
              </Pressable>
            ) : null}
          </View>
        ))}

        {/* 법적 고지 텍스트 — SSOT(crisis-hotlines.json)에서 가져오지 않고 의도적으로 본문에 하드코딩.
            약관 동의 직전 *불변 고지*가 법적 효력에 더 안전. 번호 변경 시 본 위치도 같이 업데이트. */}
        <View className="mt-6 rounded-xl px-4 py-3" style={{ backgroundColor: colors.overlayPurpleSoft ?? colors.surface }}>
          <Caption className="text-gray-300 leading-5">
            본 서비스는 의료 행위가 아니야. 위기 상황에는 자살예방상담 1393, 정신건강위기상담 1577-0199에 바로 연락해줘.
          </Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10 gap-2">
        <PrimaryButton
          label="동의하고 시작"
          onPress={handleAccept}
          loading={submitting}
          disabled={!allChecked}
        />
        <Pressable onPress={handleReject} accessibilityRole="button" hitSlop={8}>
          <Caption className="text-center text-gray-500 py-3">동의하지 않을래</Caption>
        </Pressable>
      </View>
    </ScreenWrapper>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: checked ? colors.purple[400] : colors.gray[600],
        backgroundColor: checked ? colors.purple[400] : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked ? <Icon name="check" size={14} color={colors.white} strokeWidth={3} /> : null}
    </View>
  );
}
