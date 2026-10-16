import { colors } from './colors';

/**
 * Tier 0-3: spacing / radius / elevation 토큰 (인라인 style 전용).
 *
 * className(px-6, rounded-2xl 등)을 쓸 수 있는 곳은 Tailwind 스케일이 곧 토큰이다.
 * 이 모듈은 *인라인 style 객체*에서 매직 넘버가 난립하던 곳(radius 16/20/24 혼용,
 * shadow 프리셋 복붙)을 표준화하기 위한 것 — 새 인라인 스타일은 반드시 여기서 가져온다.
 */

/** 모서리 반경 — Tailwind 대응: md=rounded-2xl(16), xl=rounded-3xl(24). */
export const radius = {
  sm: 12, // 칩·썸네일·소형 인레이
  md: 16, // 컨트롤·기본 카드
  lg: 20, // 중형 카드
  xl: 24, // 대형 카드·히어로
  pill: 999,
} as const;

/** 4pt 그리드 간격 — 인라인 padding/margin/gap 용. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * 그림자 프리셋 — 다크 테마의 1차 elevation은 서피스 톤 단차(colors L0~L3).
 * 그림자는 슬라이더 thumb·FAB처럼 *배경 위를 떠다니는 소형 부유물*에만 허용.
 */
export const elevation = {
  /** 슬라이더/패드 thumb — 강한 근접 그림자 */
  thumb: {
    shadowColor: colors.black,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 6,
  },
  /** FAB 등 플로팅 컨테이너 — 약한 확산 그림자 */
  floating: {
    shadowColor: colors.black,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
} as const;
