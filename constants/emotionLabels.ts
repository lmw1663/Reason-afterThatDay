import type { PersonaCode } from '@/utils/personaClassifier';

export const EMOTION_LABELS = [
  "분노", "배신감", "슬픔", "그리움",
  "죄책감", "안도", "자유로움",
  "외로움", "충격", "멍함",
  "자존감 흔들림", "혼란", "허무",
  // P08(권태로 끝난 장기 관계) 매트릭스 §2 C3에 따라 "공허·시들음" 추가 (C-2-G-3a)
  "공허", "시들음",
] as const;

export type EmotionLabel = typeof EMOTION_LABELS[number];

/**
 * 페르소나별 감정 라벨 정렬 — C-2-G-3a
 *
 * 매트릭스 §2 C3: P08은 "공허·멍함·시들음" 우선 노출.
 * 다른 페르소나는 baseline 순서.
 *
 * 라벨 비노출 원칙: 본 함수는 *내부 정렬*만 — 사용자는 라벨 풀이 다르게 보일 뿐
 * 페르소나 코드/명은 보지 못함.
 */
const P08_PRIORITY: readonly EmotionLabel[] = ["공허", "멍함", "시들음"];

export function getEmotionLabelsForPersona(
  primary: PersonaCode | null,
): readonly EmotionLabel[] {
  if (primary === 'P08') {
    const priority = P08_PRIORITY;
    const rest = EMOTION_LABELS.filter(l => !priority.includes(l));
    return [...priority, ...rest];
  }
  return EMOTION_LABELS;
}

export const PHYSICAL_SIGNALS = [
  "sleep_disturbance",
  "appetite_change",
  "dazed",
  "frequent_crying",
] as const;

export type PhysicalSignal = typeof PHYSICAL_SIGNALS[number];

export const PHYSICAL_SIGNAL_LABELS: Record<PhysicalSignal, string> = {
  sleep_disturbance: "잠을 못 잤어",
  appetite_change: "식욕이 없거나 너무 많아",
  dazed: "멍한 기분이 들어",
  frequent_crying: "자꾸 울음이 나와",
};

export const STRENGTH_LABELS = [
  "친절함", "유머", "책임감",
  "공감력", "성실함", "창의성",
  "포용력", "정직함", "인내심",
  "적극성", "차분함", "솔직함",
] as const;

export type StrengthLabel = typeof STRENGTH_LABELS[number];
