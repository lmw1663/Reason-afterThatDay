import { Pressable, View } from 'react-native';
import { Body, Caption } from './Typography';
import { colors } from '@/constants/colors';

// D-2 검사 응답 슬라이더 — 4점 리커트(0~3) 또는 5점(0~4) 라디오 그룹.
//
// MoodSlider는 1~10 연속 슬라이더라 PHQ/GAD/RSE의 *고정 리커트*에는 부적합.
// 본 컴포넌트는 *이산 카드 5장*까지 가로 배치 → 응답 강도와 라벨을 동시에 노출.
//
// 라벨 출처:
//  · PHQ-9: "전혀 없음 / 며칠 / 절반 이상 / 거의 매일" (한국어판 안제용 외 2013)
//  · GAD-7: 동일 (한국어판 Seo & Park 2015)
//  · RSE: "매우 그렇다 / 그렇다 / 아니다 / 매우 아니다" (전병제 1974 표준)

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  labels: string[]; // 0번 인덱스부터 N개 (PHQ/GAD = 4, RSE = 4)
  ariaLabel?: string;
}

export function AssessmentSlider({ value, onChange, labels, ariaLabel }: Props) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={ariaLabel ?? '응답 강도 선택'}
      className="gap-2"
    >
      {labels.map((label, idx) => {
        const active = value === idx;
        return (
          <Pressable
            key={idx}
            onPress={() => onChange(idx)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
            className="rounded-2xl px-4 py-3 active:opacity-80 flex-row items-center gap-3"
            style={{
              backgroundColor: active ? colors.purple[600] : colors.surface,
              borderWidth: 1,
              borderColor: active ? colors.purple[400] : colors.border,
            }}
          >
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                borderWidth: 2,
                borderColor: active ? colors.white : colors.gray[600],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {active && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.white,
                  }}
                />
              )}
            </View>
            <Body className={active ? 'text-white font-semibold' : 'text-gray-200'}>
              {label}
            </Body>
          </Pressable>
        );
      })}
    </View>
  );
}

// ───────── 표준 라벨 export ─────────

/** PHQ-9 / GAD-7 표준 4점 라벨 (지난 2주 빈도). */
export const PHQ_GAD_LABELS = [
  '전혀 없음',
  '며칠 동안',
  '절반 이상',
  '거의 매일',
];

/** RSE 표준 4점 동의 라벨. */
export const RSE_LABELS = [
  '매우 아니다',
  '아니다',
  '그렇다',
  '매우 그렇다',
];
