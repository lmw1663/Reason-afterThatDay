/**
 * 모션 토큰 — Reanimated spring·duration 표준값.
 *
 * 화면 전환·카드 진입·누름 피드백에 같은 spring을 공유해 시각 리듬을 통일.
 * 토큰 변경은 전 화면 모션 일관성에 영향 — PR 전 디자인 리뷰 권장.
 */
export const motion = {
  duration: {
    fadeUp: 220,    // 참고용 — spring은 정확한 duration이 없음
    stagger: 40,    // 카드 묶음 진입 간격 (ms). 5개 카드면 총 200ms.
  },
  spring: {
    /** ScreenWrapper fadeUp, Stagger entrance — 차분한 진입 */
    standard: { stiffness: 200, damping: 22, mass: 0.6 },
    /** EmotionPickerCard 선택 시 pop — 가볍게 튀는 느낌 */
    pop:      { stiffness: 260, damping: 20, mass: 0.5 },
    /** AnimatedPressable 누름 피드백 — 더 빠른 반응 */
    press:    { stiffness: 240, damping: 22, mass: 0.6 },
    /** 부드럽고 느린 진입 (모달 등) */
    soft:     { stiffness: 180, damping: 22, mass: 0.7 },
  },
} as const;
