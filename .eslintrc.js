module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'react-native'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: { version: 'detect' },
  },
  env: {
    browser: true,
    es2021: true,
    'react-native/react-native': true,
  },
  rules: {
    // TypeScript
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-require-imports': 'error',

    // React
    'react/react-in-jsx-scope': 'off',    // React 17+ 불필요
    'react/prop-types': 'off',             // TypeScript가 대체
    'react/no-unescaped-entities': 'off',  // React Native는 HTML 엔티티 불필요

    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'off', // useEffect 내 가드 패턴은 유효함

    // React Native
    'react-native/no-unused-styles': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'off',

    // React Hooks v7 신규 규칙 — RN 패턴 오탐으로 비활성화
    'react-hooks/immutability': 'off',
    'react-hooks/refs': 'off',      // RN Animated useRef().current 패턴 오탐
    'react-hooks/purity': 'off',    // render 중 Date.now() 등 유효한 패턴 오탐

    // General
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-var': 'error',
    'prefer-const': 'error',
    // while(true) + break 스트리밍 패턴은 유효
    'no-constant-condition': ['error', { checkLoops: false }],
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '.expo/',
    'supabase/functions/', // Deno 환경 — @ts-nocheck 필수
    'babel.config.js',
    'metro.config.js',
    'tailwind.config.js',
  ],
};
