// 색상 토큰 (Tailwind config 전용).
//
// `tailwind.config.js`가 Node 환경에서 require할 수 있도록 CommonJS로 유지.
// 런타임(앱) 코드는 `constants/colors.ts`의 ESM 정의를 사용한다.
// 토큰을 추가/변경할 때 두 파일을 함께 업데이트해야 한다.
const colors = {
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
  // Tier 0-2: 4단계 다크 서피스 — 그림자 대신 톤 단차로 elevation 표현.
  // 보라 틴트(hue~255°)를 유지한 채 단계가 올라갈수록 명도만 상승.
  bg: '#15141B',              // L0 배경
  surface: '#201E2A',         // L1 카드
  surfaceElevated: '#2A2837', // L2 상승 — pressed/플로팅/다이얼로그
  surfaceOverlay: '#353244',  // L3 오버레이 — 시트/메뉴 최상층
  border: '#34313F',
  // 액센트 보더 틴트 — 카드 위 색 식별선. 즉석 rgba(…,0.18/0.22) 난립을 토큰으로 통일.
  borderPurpleSoft: 'rgba(127,119,221,0.18)',
  borderTealSoft: 'rgba(29,158,117,0.2)',
  borderCoralSoft: 'rgba(216,90,48,0.2)',
  overlayPurpleSoft: 'rgba(127,119,221,0.1)',
  overlayPurpleWeak: 'rgba(127,119,221,0.08)',
  overlayGrayMuted: 'rgba(68,68,65,0.3)',
  overlayGrayStrong: 'rgba(68,68,65,0.4)',
  overlayTealSoft: 'rgba(29,158,117,0.1)',
  overlayCoralSoft: 'rgba(216,90,48,0.1)',
  overlayAmberSoft: 'rgba(186,117,23,0.1)',
  overlayWhiteSoft: 'rgba(255,255,255,0.14)',
  overlayWhiteFaint: 'rgba(255,255,255,0.04)',
  overlayBackdropDark: 'rgba(21,20,27,0.85)',
  scrimBgSoft: 'rgba(21,20,27,0.45)',
};

module.exports = { colors };
