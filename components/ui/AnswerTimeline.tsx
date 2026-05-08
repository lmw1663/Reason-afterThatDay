// Phase F — 답변 변화 타임라인.
// question_response_history(마이그 039)의 시계열을 D+N 라벨과 함께 표시.
// 사용자가 같은 질문에 여러 번 답한 흐름을 가로 점-선으로 보여줌.
//
// 톤 원칙 (CLAUDE.md "방향 변화 비난 금지"):
//   · 변화에 평가 어휘 없음 — "그땐", "지금은" 같은 사실 어휘만
//   · 점 색상 강조도 가장 첫/마지막만 — 중간 변화는 회색 동등 표시
//
// 호출 측은 fetchResponseHistory 결과 그대로 entries 로 넘기면 된다.

import { View } from 'react-native';
import { Body, Caption } from './Typography';
import { colors } from '@/constants/colors';
import { defaultPreviousAnswerFormatter } from './answerFormatters';

export interface TimelineEntry {
  responseValue: unknown;
  recordedAt: string;
  dPlus: number | null;
}

interface Props {
  questionText: string;
  entries: TimelineEntry[];
  formatter?: (v: unknown) => string | null;
  className?: string;
}

export function AnswerTimeline({
  questionText,
  entries,
  formatter = defaultPreviousAnswerFormatter,
  className,
}: Props) {
  if (entries.length === 0) return null;

  const renderable = entries
    .map((e) => ({ ...e, display: formatter(e.responseValue) }))
    .filter((e): e is typeof e & { display: string } => e.display != null);

  if (renderable.length === 0) return null;

  return (
    <View className={className}>
      <Caption className="text-purple-400 mb-2">{questionText}</Caption>
      {renderable.map((entry, idx) => {
        const isFirst = idx === 0;
        const isLatest = idx === renderable.length - 1;
        const dotColor = isFirst || isLatest ? colors.purple[400] : colors.gray[600];
        const labelTone =
          isFirst ? '처음' : isLatest ? '지금' : '';
        return (
          <View
            key={`${entry.recordedAt}-${idx}`}
            style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: dotColor,
                marginTop: 8,
                marginRight: 10,
              }}
            />
            <View style={{ flex: 1 }}>
              {labelTone || entry.dPlus != null ? (
                <Caption variant="subtle">
                  {[labelTone, entry.dPlus != null ? `D+${entry.dPlus}` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Caption>
              ) : null}
              <Body className="text-gray-200">{entry.display}</Body>
            </View>
          </View>
        );
      })}
    </View>
  );
}
