// Phase B — v2 §4 "유기적 연결" 카피 컴포넌트.
// 같은 질문에 *답이 바뀌었을 때만* "저번엔 X였는데, 지금은 어때?" 톤으로 띄운다.
// 답이 동일하거나 이전 답이 없으면 렌더 자체를 안 함.
//
// 톤 원칙 (CLAUDE.md "방향 변화 비난 금지"):
//   · 변화에 대한 평가·비난 금지 — "왜 또"·"왜 자꾸"·"마음이 또 바뀐" 어휘 사용 금지
//   · 가능성만 제시 — 사용자가 그대로 둬도, 새로 적어도 OK
//   · 페르소나 P03(불안형)·P11(두려움형) 안전 카피 분기는 Phase G(안전 게이트 통합)
//     에서 추가 — Phase D 단계에선 일반 어휘로도 압박감 없는 톤 확보(opus 검증 PASS)

import { Pressable, Text, View } from 'react-native';
import { useQuestionStore } from '@/store/useQuestionStore';
import { Caption } from './Typography';
import { colors } from '@/constants/colors';
import { defaultPreviousAnswerFormatter } from './answerFormatters';

export { defaultPreviousAnswerFormatter };

interface Props {
  questionId: string;
  format?: 'inline' | 'card';
  prefix?: string;
  suffix?: string;
  formatter?: (v: unknown) => string | null;
  onUseAgain?: (v: unknown) => void;
  className?: string;
  // Phase K — previousValue 가 없을 때 (한 번만 답한 사용자) responseValue 를 폴백.
  // check.tsx prefill UX: 답변이 채워졌지만 hint 가 안 떠 사용자가 인지 부조화 겪는
  // 케이스(opus K 검증 minor 1) 해소. fallbackPrefix 로 "저번엔" 대신 "전에" 같은
  // 다른 어휘 사용 권장 — 현재 답이 그대로 다시 보임을 명시.
  fallbackToLatest?: boolean;
  fallbackPrefix?: string;
}

const DEFAULT_PREFIX = '저번엔';
const DEFAULT_SUFFIX = '지금은 어때?';
const DEFAULT_FALLBACK_PREFIX = '전에';

export function PreviousAnswerHint({
  questionId,
  format = 'inline',
  prefix = DEFAULT_PREFIX,
  suffix = DEFAULT_SUFFIX,
  formatter = defaultPreviousAnswerFormatter,
  onUseAgain,
  className,
  fallbackToLatest = false,
  fallbackPrefix = DEFAULT_FALLBACK_PREFIX,
}: Props) {
  const answered = useQuestionStore((s) => s.answered[questionId]);
  const previousValue = answered?.previousValue;
  const responseValue = answered?.responseValue;
  // 1순위: previousValue (변경된 사용자) — 기존 동작
  // 2순위: responseValue (한 번만 답한 사용자) — fallbackToLatest=true 일 때만
  const usingFallback = previousValue == null && fallbackToLatest && responseValue != null;
  const value = previousValue ?? (usingFallback ? responseValue : null);
  if (value == null) return null;
  const display = formatter(value);
  if (!display) return null;
  const effectivePrefix = usingFallback ? fallbackPrefix : prefix;

  if (format === 'card') {
    const inner = (
      <View>
        <Caption className="text-purple-400 mb-1">{effectivePrefix}</Caption>
        <Text className="text-white text-base mb-1">&quot;{display}&quot;</Text>
        <Caption className="text-gray-500">{suffix}</Caption>
      </View>
    );
    const cardStyle = {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.purple[600],
    } as const;

    if (onUseAgain) {
      return (
        <Pressable
          onPress={() => onUseAgain(value)}
          accessibilityRole="button"
          accessibilityLabel={`${effectivePrefix} ${display} — 그대로 두려면 눌러봐`}
          className={className}
          style={cardStyle}
        >
          {inner}
        </Pressable>
      );
    }
    return (
      <View className={className} style={cardStyle}>
        {inner}
      </View>
    );
  }

  // inline — 한 줄 보조 카피
  return (
    <Caption className={className ?? 'text-gray-500 mb-3'}>
      {effectivePrefix} &quot;{display}&quot; — {suffix}
    </Caption>
  );
}
