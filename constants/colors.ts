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
  purple: { 50: '#EEEDFE', 400: '#7F77DD', 600: '#534AB7', 800: '#3C3489' },
  teal:   { 50: '#E1F5EE', 400: '#1D9E75', 600: '#0F6E56', 800: '#085041' },
  coral:  { 50: '#FAECE7', 400: '#D85A30', 600: '#993C1D', 800: '#712B13' },
  pink:   { 50: '#FBEAF0', 400: '#D4537E', 600: '#993556', 800: '#72243E' },
  amber:  { 50: '#FAEEDA', 400: '#BA7517', 600: '#854F0B', 800: '#633806' },
  gray:   { 50: '#F1EFE8', 400: '#A8A6A0', 600: '#5F5E5A', 800: '#444441' },
  white: '#FFFFFF',
  black: '#000000',
  bg: '#0E0E12',
  surface: '#1A1A22',
  border: '#2C2C38',
  overlayPurpleSoft:   'rgba(127,119,221,0.1)',
  overlayPurpleWeak:   'rgba(127,119,221,0.08)',
  overlayGrayMuted:    'rgba(68,68,65,0.3)',
  overlayGrayStrong:   'rgba(68,68,65,0.4)',
  overlayTealSoft:     'rgba(29,158,117,0.1)',
  overlayAmberSoft:    'rgba(186,117,23,0.1)',
  overlayBackdropDark: 'rgba(14,14,18,0.85)',
} as const;
