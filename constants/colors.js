// 색상 토큰 (Tailwind config 전용).
//
// `tailwind.config.js`가 Node 환경에서 require할 수 있도록 CommonJS로 유지.
// 런타임(앱) 코드는 `constants/colors.ts`의 ESM 정의를 사용한다.
// 토큰을 추가/변경할 때 두 파일을 함께 업데이트해야 한다.
const colors = {
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
  overlayPurpleSoft: 'rgba(127,119,221,0.1)',
  overlayPurpleWeak: 'rgba(127,119,221,0.08)',
  overlayGrayMuted: 'rgba(68,68,65,0.3)',
  overlayGrayStrong: 'rgba(68,68,65,0.4)',
  overlayTealSoft: 'rgba(29,158,117,0.1)',
  overlayAmberSoft: 'rgba(186,117,23,0.1)',
  overlayBackdropDark: 'rgba(14,14,18,0.85)',
};

module.exports = { colors };
