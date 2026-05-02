export const EMOTION_LABELS = [
  "분노", "배신감", "슬픔", "그리움",
  "죄책감", "안도", "자유로움",
  "외로움", "충격", "멍함",
  "자존감 흔들림", "혼란", "허무",
] as const;

export type EmotionLabel = typeof EMOTION_LABELS[number];

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
