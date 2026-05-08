// Phase L-2 — vitest 환경에서 react-native 컴포넌트를 렌더 가능한 형태로 mock.
//
// react-native 패키지는 Flow 문법을 포함해 vitest 가 직접 import 하면 파싱 실패.
// 본 mock 은 자주 쓰는 RN 프리미티브를 React.createElement 로 wrapping —
// react-test-renderer 가 JSON tree 형태로 출력 가능.
//
// 적용: vitest.config.ts 의 `test.setupFiles` 에 등록.
//
// 정책:
//   - 시각적 정확성 보장 안 함 (jsx prop 흐름만 통과)
//   - 동작 분기(조건부 null 렌더, hooks state) 검증용
//   - 더 깊은 RN 동작은 jest-expo 마이그레이션 (SSOT §9-2 (a)) 별도 페이즈

import { vi } from 'vitest';
import * as React from 'react';

// RN 컴포넌트를 *소문자 HTML 커스텀 엘리먼트* 로 우회. React 가 lowercase 를
// host 로 처리해 react-dom/server.renderToStaticMarkup 이 HTML 문자열로 출력 가능.
// 'View' → 'rn-view', 'Text' → 'rn-text' 등 prefix 로 충돌 회피.
const passthrough = (name: string) => {
  const tag = `rn-${name.toLowerCase()}`;
  return React.forwardRef<unknown, { children?: React.ReactNode; className?: string; style?: unknown }>(
    (props, _ref) => {
      // RN 전용 prop (style 객체, accessibility 등) 은 HTML 호환 안 되니 className 만 노출
      // 나머지 props 는 data-* 로 디버깅 가능하게 직렬화 — 단순 string/number 만
      const safeProps: Record<string, unknown> = {};
      if (props.className) safeProps.className = props.className;
      return React.createElement(tag, safeProps, props.children);
    },
  );
};

vi.mock('react-native', () => ({
  View: passthrough('View'),
  Text: passthrough('Text'),
  Pressable: passthrough('Pressable'),
  ScrollView: passthrough('ScrollView'),
  ActivityIndicator: passthrough('ActivityIndicator'),
  TextInput: passthrough('TextInput'),
  TouchableOpacity: passthrough('TouchableOpacity'),
  Image: passthrough('Image'),
  // 기타 RN export — 누락된 것은 호출 시점에 실패하므로 추가 등록
  StyleSheet: {
    create: <T extends object>(s: T): T => s,
    flatten: (s: unknown) => s,
  },
  Platform: { OS: 'ios', select: <T,>(map: { ios: T }) => map.ios },
  Dimensions: { get: () => ({ width: 375, height: 667 }) },
}));

// nativewind 의 className → style 변환 — 우리 mock 은 className 그대로 전달
vi.mock('nativewind', () => ({
  styled: (component: unknown) => component,
  remapProps: () => undefined,
}));
