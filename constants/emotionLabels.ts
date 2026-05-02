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
