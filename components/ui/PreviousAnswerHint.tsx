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

interface Props {
  questionId: string;
  format?: 'inline' | 'card';
  prefix?: string;
  suffix?: string;
  formatter?: (v: unknown) => string | null;
  onUseAgain?: (v: unknown) => void;
  className?: string;
}

const DEFAULT_PREFIX = '저번엔';
const DEFAULT_SUFFIX = '지금은 어때?';

// jsonb 응답값 → 표시 문자열. 객체는 안전하게 표시 불가능 — 호출자가 formatter 명시.
export function defaultPreviousAnswerFormatter(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : null;
  if (typeof v === 'boolean') return v ? '그래' : '아니야';
  if (Array.isArray(v)) {
    const items = v.filter((x) => x != null && x !== '').map(String);
    return items.length > 0 ? items.join(', ') : null;
  }
  return null;
}

export function PreviousAnswerHint({
  questionId,
  format = 'inline',
  prefix = DEFAULT_PREFIX,
  suffix = DEFAULT_SUFFIX,
  formatter = defaultPreviousAnswerFormatter,
  onUseAgain,
  className,
}: Props) {
  const previousValue = useQuestionStore((s) => s.answered[questionId]?.previousValue);
  // null/undefined 모두 falsy — Phase A 의 store/서버 trigger 양쪽이 같은 의미.
  if (previousValue == null) return null;
  const display = formatter(previousValue);
  if (!display) return null;

  if (format === 'card') {
    const inner = (
      <View>
        <Caption className="text-purple-400 mb-1">{prefix}</Caption>
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
          onPress={() => onUseAgain(previousValue)}
          accessibilityRole="button"
          accessibilityLabel={`${prefix} ${display} — 그대로 두려면 눌러봐`}
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
      {prefix} &quot;{display}&quot; — {suffix}
    </Caption>
  );
}
