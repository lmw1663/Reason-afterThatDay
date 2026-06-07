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
  purple: { 50: '#EEEDFE', 300: '#A8A2E6', 400: '#7F77DD', 500: '#6960C9', 600: '#534AB7', 700: '#473F9E', 800: '#3C3489' },
  teal:   { 50: '#E1F5EE', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
  coral:  { 50: '#FAECE7', 400: '#D85A30', 600: '#993C1D', 800: '#712B13' },
  pink:   { 50: '#FBEAF0', 400: '#D4537E', 600: '#993556', 800: '#72243E' },
  amber:  { 50: '#FAEEDA', 400: '#BA7517', 600: '#854F0B', 700: '#74460A', 800: '#633806' },
  blue:   { 50: '#E5EEFB', 400: '#5B8FE8', 600: '#2E5DB8', 800: '#1B3F80' },
  gray:   { 50: '#F1EFE8', 100: '#E6E3DB', 200: '#D2CFC5', 300: '#BBB8AE', 400: '#A8A6A0', 500: '#84827B', 600: '#5F5E5A', 700: '#4E4D49', 800: '#444441', 900: '#2B2B28' },
  white: '#FFFFFF',
  black: '#000000',
  // 순흑(#000)·near-black(#0E0E12)은 OLED에서 halation·답답함을 유발 → Material/2025
  // 가이드대로 살짝 들어올린 "편안한 다크"로 변경. 브랜드 보라(#7F77DD) 틴트를 미세하게
  // 유지(hue~255°)해 카드(surface)와 통일감. bg↔surface 명도차는 elevation 위해 보존.
  bg: '#15141B',
  surface: '#201E2A',
  border: '#34313F',
  overlayPurpleSoft:   'rgba(127,119,221,0.1)',
  overlayPurpleWeak:   'rgba(127,119,221,0.08)',
  overlayGrayMuted:    'rgba(68,68,65,0.3)',
  overlayGrayStrong:   'rgba(68,68,65,0.4)',
  overlayTealSoft:     'rgba(29,158,117,0.1)',
  overlayCoralSoft:    'rgba(216,90,48,0.1)',
  overlayAmberSoft:    'rgba(186,117,23,0.1)',
  overlayBackdropDark: 'rgba(21,20,27,0.85)',
} as const;
