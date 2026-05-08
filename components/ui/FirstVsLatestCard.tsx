// Phase F — "처음 ↔ 지금" 단일 비교 카드.
// AnswerTimeline 의 압축형 — 첫 답변과 마지막 답변만 짝지어 보여줌.
// 졸업 letter / 매듭 archive 같은 회상 화면에서 한눈에 변화를 직시.
//
// 톤 원칙 (CLAUDE.md "방향 변화 비난 금지"):
//   · "N번 바뀌었어" 같은 *변화 횟수 강조* 미사용 — 사실(처음·지금) 만 표시
//   · 두 답변이 같으면(노변화) 카드 자체를 안 그림 — "그대로네" 라는 단정 회피
//
// Phase B opus 권장 (P03/P05 안전 카피 분기) 반영 — 본 카드는 횟수 미표시라 그 자체로
// 페르소나 무차별. 별도 분기 불필요.

import { View } from 'react-native';
import { Body, Caption } from './Typography';
import { colors } from '@/constants/colors';
import { defaultPreviousAnswerFormatter } from './answerFormatters';

export interface FirstVsLatestEntry {
  value: unknown;
  dPlus: number | null;
}

interface Props {
  questionText: string;
  first: FirstVsLatestEntry;
  latest: FirstVsLatestEntry;
  formatter?: (v: unknown) => string | null;
  className?: string;
}

export function FirstVsLatestCard({
  questionText,
  first,
  latest,
  formatter = defaultPreviousAnswerFormatter,
  className,
}: Props) {
  const firstStr = formatter(first.value);
  const latestStr = formatter(latest.value);
  if (!firstStr || !latestStr) return null;
  // 같은 답이면 카드 미표시 — "그대로네" 단정 회피
  if (firstStr === latestStr) return null;

  return (
    <View
      className={className}
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.purple[600],
      }}
    >
      <Caption className="text-purple-400 mb-3">{questionText}</Caption>

      <View style={{ marginBottom: 12 }}>
        <Caption variant="subtle">
          처음{first.dPlus != null ? ` · D+${first.dPlus}` : ''}
        </Caption>
        <Body className="text-gray-300">&quot;{firstStr}&quot;</Body>
      </View>

      <View>
        <Caption variant="subtle">
          지금{latest.dPlus != null ? ` · D+${latest.dPlus}` : ''}
        </Caption>
        <Body className="text-white">&quot;{latestStr}&quot;</Body>
      </View>
    </View>
  );
}
