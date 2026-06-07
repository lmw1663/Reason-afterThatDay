/**
 * 색상 토큰 단일 출처 (런타임용).
 *
 * `tailwind.config.js`는 동일한 값을 `constants/colors.js`(CommonJS)에서 가져온다.
 * 두 파일은 항상 같은 값을 유지해야 한다 — 토큰을 추가/변경할 때 둘 다 업데이트.
 *
 * 과거에는 `colors.ts`가 `require('./colors.js')`로 CJS를 끌어다 썼는데,
 * Hermes/Metro 환경에서 동적 require가 종종 미해결되어 `Property 'colors' doesn't exist`
 * 런타임 에러가 발생했다. 이를 피하기 위해 ESM 정적 정의로 통일한다.
 */
export const colors = {
  // ramp 누락 단계는 className(text-gray-500 등)에서 Tailwind 기본 팔레트로 폴백돼
  // 디자인 토큰과 다른 색이 섞이던 문제가 있었다 → 실사용 단계를 따뜻한 톤으로 채움.
  //
  // Tier 3-2 — 7패밀리 역할 고정 (의미 인플레이션 금지):
  //   purple = 브랜드·기본 액션·선택 상태      teal  = 회복·긍정 피드백
  //   coral  = 위기·오류·파괴적 액션            amber = 주의·시간성 안내
  //   pink   = 관계·애정 차원 데이터            blue  = 저온(가라앉은) 감정 데이터
  //   gray   = 중립·비활성
  //   예외: 데이터 시각화(슬라이더 그라데이션·미터·감정/카테고리 칩)는 값·구분 표현에 한해 교차 허용 (Stocks 원칙).
  //   UI 피드백(에러·경고·성공·정보)에는 위 역할만 사용한다 — 새 화면에서 amber로 에러, teal로 경고 금지.
  //
  // 400 단계는 텍스트 사용 전제 — surface(#201E2A) 위 WCAG AA 4.5:1 이상 유지
  // (teal 4.84 / amber 4.72 / coral 4.62 / pink 4.60 / purple 4.69 / blue 5.11).
  purple: { 50: '#EEEDFE', 300: '#A8A2E6', 400: '#857DE0', 500: '#6960C9', 600: '#534AB7', 700: '#473F9E', 800: '#3C3489' },
  teal:   { 50: '#E1F5EE', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
  coral:  { 50: '#FAECE7', 400: '#DE6238', 600: '#993C1D', 800: '#712B13' },
  pink:   { 50: '#FBEAF0', 400: '#D95E86', 600: '#993556', 800: '#72243E' },
  amber:  { 50: '#FAEEDA', 400: '#C07A18', 600: '#854F0B', 700: '#74460A', 800: '#633806' },
  blue:   { 50: '#E5EEFB', 400: '#5B8FE8', 600: '#2E5DB8', 800: '#1B3F80' },
  gray:   { 50: '#F1EFE8', 100: '#E6E3DB', 200: '#D2CFC5', 300: '#BBB8AE', 400: '#A8A6A0', 500: '#84827B', 600: '#5F5E5A', 700: '#4E4D49', 800: '#444441', 900: '#2B2B28' },
  white: '#FFFFFF',
  black: '#000000',
  // 순흑(#000)·near-black(#0E0E12)은 OLED에서 halation·답답함을 유발 → Material/2025
  // 가이드대로 살짝 들어올린 "편안한 다크"로 변경. 브랜드 보라(#857DE0) 틴트를 미세하게
  // 유지(hue~255°)해 카드(surface)와 통일감. bg↔surface 명도차는 elevation 위해 보존.
  // Tier 0-2: 4단계 다크 서피스 — 그림자 대신 톤 단차로 elevation 표현.
  // 보라 틴트(hue~255°)를 유지한 채 단계가 올라갈수록 명도만 상승.
  bg: '#15141B',              // L0 배경
  surface: '#201E2A',         // L1 카드
  surfaceElevated: '#2A2837', // L2 상승 — pressed/플로팅/다이얼로그
  surfaceOverlay: '#353244',  // L3 오버레이 — 시트/메뉴 최상층
  border: '#34313F',
  // 액센트 보더 틴트 — 카드 위 색 식별선. 즉석 rgba(…,0.18/0.22) 난립을 토큰으로 통일.
  borderPurpleSoft:    'rgba(133,125,224,0.18)',
  borderTealSoft:      'rgba(29,158,117,0.2)',
  borderCoralSoft:     'rgba(222,98,56,0.2)',
  overlayPurpleSoft:   'rgba(133,125,224,0.1)',
  overlayPurpleWeak:   'rgba(133,125,224,0.08)',
  overlayGrayMuted:    'rgba(68,68,65,0.3)',
  overlayGrayStrong:   'rgba(68,68,65,0.4)',
  overlayTealSoft:     'rgba(29,158,117,0.1)',
  overlayCoralSoft:    'rgba(222,98,56,0.1)',
  overlayAmberSoft:    'rgba(192,122,24,0.1)',
  overlayWhiteSoft:    'rgba(255,255,255,0.14)',
  overlayWhiteFaint:   'rgba(255,255,255,0.04)',
  overlayBackdropDark: 'rgba(21,20,27,0.85)',
  scrimBgSoft:         'rgba(21,20,27,0.45)',
} as const;
