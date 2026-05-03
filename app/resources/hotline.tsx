import { Linking, ScrollView, Text, View, Pressable } from 'react-native';
import { router } from 'expo-router';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { BackHeader } from '@/components/ui/BackHeader';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';
// 핫라인 정보는 하드코딩 금지 — utils/crisisHotlines가 JSON에서 로드
import { getAllHotlines } from '@/utils/crisisHotlines';

export default function HotlineScreen() {
  const hotlines = getAllHotlines();

  function callNumber(number: string) {
    Linking.openURL(`tel:${number}`);
  }

  function openUrl(url: string) {
    Linking.openURL(url);
  }

  return (
    <ScreenWrapper>
      <ScrollView
        className="flex-1 px-6 pt-14"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <BackHeader />
        {/* 이 화면은 정보 전달 목적 — 존댓말 예외 (CLAUDE.md 위기 안내 톤 규칙) */}
        <Heading className="mb-2">어려울 때 도움을 받을 수 있는 곳</Heading>
        <Body className="text-gray-400 mb-8">
          모든 상담은 무료이며 비밀이 보장됩니다.
        </Body>

        <View className="gap-4 mb-8">
          {hotlines.map((h) => (
            <Pressable
              key={h.id}
              onPress={() => h.number ? callNumber(h.number) : h.url ? openUrl(h.url) : undefined}
              accessibilityRole="button"
              accessibilityLabel={`${h.name} ${h.number ?? '온라인 상담'}`}
              className="rounded-2xl p-4 active:opacity-70"
              style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-white font-semibold flex-1">{h.name}</Text>
                <Caption className="text-teal-400 ml-2">{h.available}</Caption>
              </View>
              {h.number && (
                <Text className="text-purple-400 text-lg font-bold mb-1">
                  📞 {h.number}
                </Text>
              )}
              {h.url && (
                <Text className="text-purple-400 text-sm mb-1">{h.url}</Text>
              )}
              <Caption className="text-gray-500">{h.description}</Caption>
              <Caption className="text-gray-600 mt-1">운영: {h.operator}</Caption>
            </Pressable>
          ))}
        </View>

        <View
          className="rounded-2xl p-4"
          style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.gray[800] }}
        >
          <Caption className="text-gray-400 leading-relaxed">
            알려두기:{'\n'}
            • 모든 상담은 비밀이 보장됩니다.{'\n'}
            • 위 번호로 연락하지 않아도 괜찮습니다.{'\n'}
            • 본인의 선택을 존중합니다.
          </Caption>
        </View>
      </ScrollView>

      <View className="px-6 pb-10">
        <PrimaryButton
          label="🫧 앱 안에서 호흡하기"
          variant="ghost"
          onPress={() => router.replace('/(tabs)' as never)}
        />
      </View>
    </ScreenWrapper>
  );
}
