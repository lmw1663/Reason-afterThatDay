import { Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { AnimatedPressable } from './AnimatedPressable';
import { Body, Caption } from './Typography';
import { Icon } from './Icon';
import { useStaggerEntrance } from '@/hooks/useStaggerEntrance';
import { colors } from '@/constants/colors';
import { radius } from '@/constants/layout';
import { getContextTheme } from '@/constants/questionContextTheme';
import type { Question } from '@/store/useQuestionStore';

export type QuestionPoolCardVariant = 'hero' | 'tailored' | 'standard';

interface Props {
  question: Question;
  variant: QuestionPoolCardVariant;
  recommended?: boolean;
  staggerIndex: number;
  onPress: () => void;
}

/**
 * 질문통 카드 — Hero / Tailored row / Standard row 3-tier 위계.
 *
 * - Hero: 56pt 원형 아이콘 배지 + 18pt/700 본문 + 하단 context chip + recommended sparkle
 * - Tailored row: 40pt 배지 + 16pt/500 본문 + 좌측 3px accent bar
 * - Standard row: 36pt 옅은 배지 + 15pt/400 본문, accent 없음
 *
 * 모든 카드는 AnimatedPressable spring 누름 + useStaggerEntrance fadeUp 진입.
 * context별 색·아이콘은 getContextTheme로 결정 (사용자 친화 라벨 노출).
 */
export function QuestionPoolCard({ question, variant, recommended, staggerIndex, onPress }: Props) {
  const theme = getContextTheme(question.context);
  const enterStyle = useStaggerEntrance(Math.min(staggerIndex, 8));

  if (variant === 'hero') {
    return (
      <Animated.View style={enterStyle}>
        <AnimatedPressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${theme.label} — ${question.text} — 답하기`}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.borderPurpleSoft,
            padding: 20,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 16 }}>
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: theme.bgOverlay,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name={theme.icon} size={26} color={theme.accentColor} />
            </View>
            <View style={{ flex: 1 }}>
              {recommended && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                  <Icon name="sparkles" size={12} color={theme.accentColor} />
                  <Text
                    style={{
                      fontFamily: 'Pretendard',
                      fontSize: 11,
                      fontWeight: '700',
                      color: theme.accentColor,
                      letterSpacing: 0.3,
                    }}
                  >
                    추천
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontFamily: 'Pretendard',
                  fontSize: 18,
                  fontWeight: '700',
                  color: colors.white,
                  lineHeight: 28,
                }}
              >
                {question.text}
              </Text>
              <View
                style={{
                  alignSelf: 'flex-start',
                  marginTop: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: radius.pill,
                  backgroundColor: theme.bgOverlay,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Pretendard',
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.accentColor,
                  }}
                >
                  {theme.label}
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={20} color={colors.gray[600]} />
          </View>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  if (variant === 'tailored') {
    return (
      <Animated.View style={enterStyle}>
        <AnimatedPressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${theme.label} — ${question.text} — 답하기`}
          style={{
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 16,
            paddingLeft: 18,
            paddingRight: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            overflow: 'hidden',
          }}
        >
          {/* 좌측 3px accent bar */}
          <View
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: theme.accentColor,
              opacity: 0.55,
            }}
          />
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.pill, // 원형 배지 — 기하값(40/2)이라 카드 radius 토큰과 분리
              backgroundColor: theme.bgOverlay,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name={theme.icon} size={20} color={theme.accentColor} />
          </View>
          <Body
            style={{
              flex: 1,
              fontSize: 16,
              fontWeight: '500',
              color: colors.gray[50],
              lineHeight: 22,
            }}
          >
            {question.text}
          </Body>
          <Icon name="chevron-right" size={18} color={colors.gray[600]} />
        </AnimatedPressable>
      </Animated.View>
    );
  }

  // standard
  return (
    <Animated.View style={enterStyle}>
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${theme.label} — ${question.text} — 답하기`}
        style={{
          backgroundColor: colors.surface,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: recommended ? theme.bgOverlay : colors.overlayWhiteFaint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name={theme.icon} size={18} color={theme.accentColor} />
        </View>
        <View style={{ flex: 1 }}>
          {recommended && (
            <Caption
              style={{
                color: theme.accentColor,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.3,
                marginBottom: 2,
              }}
            >
              추천
            </Caption>
          )}
          <Text
            style={{
              fontFamily: 'Pretendard',
              fontSize: 15,
              fontWeight: '400',
              color: colors.gray[50],
              lineHeight: 22,
            }}
          >
            {question.text}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color={colors.gray[600]} />
      </AnimatedPressable>
    </Animated.View>
  );
}
