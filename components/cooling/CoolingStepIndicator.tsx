import { Fragment } from 'react';
import { View } from 'react-native';
import { Caption } from '@/components/ui/Typography';
import { colors } from '@/constants/colors';

/**
 * Fi 스텝 인디케이터 — 시작 / 마음 정리 / {페르소나별 매듭 라벨} 3단계.
 * 페르소나별 cooling 일수가 7/14/30으로 가변이라 일별 도트 대신 페이즈로 추상화.
 *
 * 단계 경계:
 *  - 시작:      Day 1                       (D-N 카운트다운 진입)
 *  - 마음 정리: Day 2 ~ Day (N-1)            (감정 회복 본구간)
 *  - 마지막:    Day N                       (최종 확인 가능)
 *
 * 채워진 도트 = 도달한 단계, 비어 있는 도트 = 미도달.
 * 마지막 단계 라벨은 페르소나별 어휘 SSOT(useKnotPolicy().label)를 그대로 받는다 —
 * "매듭" 하드코딩 금지 (P16·P17="마무리", P20="단절 30일 달성").
 */
export function CoolingStepIndicator({
  currentDay,
  totalDays,
  finalLabel,
}: {
  currentDay: number;
  totalDays: number;
  /** 페르소나별 매듭 라벨 — utils/knotPolicy.ts KnotLabel */
  finalLabel: string;
}) {
  const phase: 1 | 2 | 3 = currentDay <= 1 ? 1 : currentDay >= totalDays ? 3 : 2;
  const steps: Array<{ stage: 1 | 2 | 3; label: string }> = [
    { stage: 1, label: '시작' },
    { stage: 2, label: '마음 정리' },
    { stage: 3, label: finalLabel },
  ];

  return (
    <View
      className="mb-5"
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`유예 진행 — 3단계 중 ${phase}단계, ${steps[phase - 1].label}`}
      accessibilityValue={{ min: 1, max: 3, now: phase }}
    >
      {/* 도트+연결선 행 — 라벨 폭과 무관하게 선이 도트에 맞닿도록 라벨 행과 분리 */}
      <View className="flex-row items-center">
        {steps.map((step, idx) => {
          const reached = step.stage <= phase;
          return (
            <Fragment key={step.stage}>
              {idx > 0 && (
                <View
                  className="mx-2"
                  style={{
                    flex: 1,
                    height: 1.5,
                    backgroundColor: reached ? colors.purple[400] : colors.gray[600],
                  }}
                />
              )}
              <View
                className="rounded-full"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: reached ? colors.purple[400] : 'transparent',
                  borderWidth: reached ? 0 : 1.5,
                  borderColor: colors.gray[600],
                }}
              />
            </Fragment>
          );
        })}
      </View>
      {/* 라벨 행 — 좌/중앙/우 정렬이 도트 위치(좌단/중앙/우단)와 대응 */}
      <View className="flex-row justify-between mt-2">
        {steps.map((step) => (
          <Caption
            key={step.stage}
            style={{
              color: step.stage <= phase ? colors.purple[400] : colors.gray[600],
              fontSize: 11,
            }}
          >
            {step.label}
          </Caption>
        ))}
      </View>
    </View>
  );
}
